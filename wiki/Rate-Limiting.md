# Rate Limiting

AllyLab API includes rate limiting to ensure fair usage and protect against abuse. This guide explains how rate limiting works and how to handle rate limit errors.

## Default Limits

| Endpoint Category | Limit | Time Window |
|-------------------|-------|-------------|
| General API | 100 requests | 1 minute |
| Scan endpoints | 20 requests | 1 minute |
| Batch scan | 5 requests | 1 minute |
| Fix generation | 30 requests | 1 minute |
| GitHub PR creation | 10 requests | 1 minute |
| Authentication | 5 requests | 1 minute |
| Webhooks | 100 requests | 1 minute |

## Rate Limit Headers

Every API response includes rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706745600
```

- `X-RateLimit-Limit`: Maximum requests allowed in the time window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

## Handling Rate Limit Errors

When you exceed the rate limit, the API returns a `429 Too Many Requests` response:

```json
{
  "success": false,
  "error": "Too many requests",
  "code": "RATE_LIMITED",
  "details": {
    "retryAfter": "60"
  },
  "requestId": "abc123"
}
```

### Best Practices

1. **Check headers**: Monitor `X-RateLimit-Remaining` to avoid hitting limits
2. **Implement backoff**: Use exponential backoff when retrying
3. **Cache results**: Cache scan results to reduce API calls
4. **Batch requests**: Use batch endpoints when processing multiple items

### Example: Exponential Backoff

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, Math.max(delay, retryAfter * 1000)));
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

## Bypassed Endpoints

The following endpoints are not rate limited:

- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /docs` - API documentation

## Plan Limits

Rate limits vary by plan:

| Plan | Scans/month | Pages/scan | API calls/minute |
|------|-------------|------------|------------------|
| Free | 10 | 5 | 100 |
| Pro | 100 | 25 | 500 |
| Team | 500 | 100 | 1000 |
| Enterprise | Unlimited | Unlimited | Custom |

## Requesting Higher Limits

Enterprise customers can request custom rate limits. Contact sales@allylab.com for more information.

## Monitoring Usage

View your API usage in the dashboard under **Settings > API Usage**. This shows:

- Total requests this month
- Requests by endpoint
- Rate limit events
- Usage trends

## CLI Rate Limiting

The AllyLab CLI automatically handles rate limiting with built-in retry logic:

```bash
# Batch scan with automatic rate limit handling
allylab scan --file urls.txt --concurrency 5

# The CLI will automatically pause and retry if rate limited
```

Configure CLI behavior in `allylab.config.json`:

```json
{
  "rateLimit": {
    "maxRetries": 3,
    "retryDelay": 5000,
    "concurrency": 5
  }
}
```
