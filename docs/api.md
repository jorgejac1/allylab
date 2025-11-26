# API Reference

Complete documentation for the AllyLab REST API.

## Base URL
```
http://localhost:3001
```

## Authentication

Currently, the API does not require authentication. For production deployments, consider adding API key authentication.

---

## Endpoints Overview

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| Health | `GET` | `/health` | Health check |
| Scanning | `POST` | `/scan` | Scan with SSE streaming |
| Scanning | `POST` | `/scan/json` | Scan with JSON response |
| Schedules | `GET` | `/schedules` | List schedules |
| Schedules | `POST` | `/schedules` | Create schedule |
| Schedules | `GET` | `/schedules/:id` | Get schedule |
| Schedules | `PATCH` | `/schedules/:id` | Update schedule |
| Schedules | `DELETE` | `/schedules/:id` | Delete schedule |
| Schedules | `POST` | `/schedules/:id/run` | Run immediately |
| Schedules | `GET` | `/schedules/:id/history` | Get run history |
| JIRA | `POST` | `/jira/test` | Test connection |
| JIRA | `POST` | `/jira/create` | Create issue |
| JIRA | `POST` | `/jira/bulk` | Bulk create issues |
| JIRA | `GET` | `/jira/issue/:key` | Get issue |
| JIRA | `POST` | `/jira/link` | Link finding |

---

## Health Check

### GET /health

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Scanning

### POST /scan

Start an accessibility scan with Server-Sent Events (SSE) streaming.

**Request Body:**
```json
{
  "url": "https://example.com",
  "standard": "wcag21aa",
  "viewport": "desktop",
  "includeWarnings": false
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | string | Yes | - | URL to scan |
| `standard` | string | No | `wcag21aa` | WCAG standard |
| `viewport` | string | No | `desktop` | Viewport size |
| `includeWarnings` | boolean | No | `false` | Include incomplete checks |

**Response:** Server-Sent Events stream
```
event: progress
data: {"percent": 10, "message": "Navigating to page..."}

event: progress
data: {"percent": 40, "message": "Running accessibility scan..."}

event: finding
data: {"id": "color-contrast-0", "ruleId": "color-contrast", ...}

event: complete
data: {"id": "scan_123", "url": "https://example.com", "score": 85, ...}
```

**Event Types:**

| Event | Description |
|-------|-------------|
| `progress` | Scan progress update |
| `finding` | Individual accessibility issue found |
| `complete` | Scan finished with full results |
| `error` | Scan failed |

---

### POST /scan/json

Start an accessibility scan and return JSON result.

**Request Body:**
```json
{
  "url": "https://example.com",
  "standard": "wcag21aa",
  "viewport": "desktop",
  "includeWarnings": false
}
```

**Response:**
```json
{
  "id": "scan_1705312200000_abc123",
  "url": "https://example.com",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "score": 85,
  "totalIssues": 12,
  "critical": 0,
  "serious": 2,
  "moderate": 6,
  "minor": 4,
  "findings": [
    {
      "id": "color-contrast-0",
      "ruleId": "color-contrast",
      "ruleTitle": "Elements must meet minimum color contrast ratio thresholds",
      "description": "Ensure the contrast between foreground and background colors...",
      "impact": "serious",
      "selector": ".header-text",
      "html": "<span class=\"header-text\">Welcome</span>",
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.8/color-contrast",
      "wcagTags": ["wcag2aa", "wcag143"]
    }
  ],
  "scanDuration": 4823,
  "viewport": "desktop"
}
```

**Error Response:**
```json
{
  "error": "Failed to navigate to URL",
  "details": "net::ERR_NAME_NOT_RESOLVED"
}
```

---

## Schedules

### GET /schedules

List all scheduled scans.

**Response:**
```json
{
  "schedules": [
    {
      "id": "sch_1705312200000_abc123",
      "url": "https://example.com",
      "frequency": "daily",
      "enabled": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastRun": "2024-01-16T10:30:00.000Z",
      "nextRun": "2024-01-17T10:30:00.000Z",
      "lastScore": 85,
      "lastIssues": 12
    }
  ]
}
```

---

### POST /schedules

Create a new scheduled scan.

**Request Body:**
```json
{
  "url": "https://example.com",
  "frequency": "daily"
}
```

**Parameters:**

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `url` | string | Yes | Valid URL |
| `frequency` | string | Yes | `hourly`, `daily`, `weekly`, `monthly` |

**Response:**
```json
{
  "id": "sch_1705312200000_abc123",
  "url": "https://example.com",
  "frequency": "daily",
  "enabled": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "nextRun": "2024-01-16T10:30:00.000Z"
}
```

---

### GET /schedules/:id

Get a specific schedule.

**Response:**
```json
{
  "id": "sch_1705312200000_abc123",
  "url": "https://example.com",
  "frequency": "daily",
  "enabled": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "lastRun": "2024-01-16T10:30:00.000Z",
  "nextRun": "2024-01-17T10:30:00.000Z",
  "lastScore": 85,
  "lastIssues": 12
}
```

---

### PATCH /schedules/:id

Update a schedule.

**Request Body:**
```json
{
  "frequency": "weekly",
  "enabled": false
}
```

**Response:** Updated schedule object

---

### DELETE /schedules/:id

Delete a schedule.

**Response:**
```json
{
  "success": true
}
```

---

### POST /schedules/:id/run

Run a scheduled scan immediately.

**Response:**
```json
{
  "scheduleId": "sch_1705312200000_abc123",
  "url": "https://example.com",
  "score": 85,
  "totalIssues": 12,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "success": true
}
```

---

### GET /schedules/:id/history

Get run history for a schedule.

**Response:**
```json
{
  "history": [
    {
      "scheduleId": "sch_1705312200000_abc123",
      "url": "https://example.com",
      "score": 85,
      "totalIssues": 12,
      "timestamp": "2024-01-16T10:30:00.000Z",
      "success": true
    },
    {
      "scheduleId": "sch_1705312200000_abc123",
      "url": "https://example.com",
      "score": 82,
      "totalIssues": 15,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "success": true
    }
  ]
}
```

---

## JIRA Integration

### POST /jira/test

Test JIRA connection.

**Response (Mock Mode):**
```json
{
  "success": true,
  "message": "Mock mode - connection simulated",
  "mockMode": true
}
```

**Response (Live):**
```json
{
  "success": true,
  "message": "Connected as John Doe",
  "mockMode": false
}
```

---

### POST /jira/create

Create a single JIRA issue.

**Request Body:**
```json
{
  "fields": {
    "project": { "key": "A11Y" },
    "issuetype": { "name": "Bug" },
    "summary": "[A11Y] Color contrast issue - SERIOUS",
    "description": "*Issue:* Elements must meet minimum color contrast...",
    "priority": { "name": "High" },
    "labels": ["wcag-1.4.3", "color-contrast"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "key": "A11Y-123",
  "id": "10001",
  "self": "https://your-domain.atlassian.net/rest/api/2/issue/10001"
}
```

---

### POST /jira/bulk

Create multiple JIRA issues.

**Request Body:**
```json
{
  "issues": [
    {
      "fields": {
        "project": { "key": "A11Y" },
        "issuetype": { "name": "Bug" },
        "summary": "[A11Y] Issue 1",
        "description": "Description 1"
      }
    },
    {
      "fields": {
        "project": { "key": "A11Y" },
        "issuetype": { "name": "Bug" },
        "summary": "[A11Y] Issue 2",
        "description": "Description 2"
      }
    }
  ]
}
```

**Response:**
```json
{
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    { "success": true, "key": "A11Y-123" },
    { "success": true, "key": "A11Y-124" }
  ]
}
```

---

### GET /jira/issue/:key

Get a JIRA issue (mock mode only returns stored mock issues).

**Response:**
```json
{
  "key": "MOCK-1",
  "fields": {
    "summary": "[A11Y] Color contrast issue",
    "project": { "key": "A11Y" },
    "issuetype": { "name": "Bug" }
  },
  "mockMode": true
}
```

---

### POST /jira/link

Link a finding to an existing JIRA issue.

**Request Body:**
```json
{
  "findingId": "color-contrast-0",
  "issueKey": "A11Y-123",
  "scanId": "scan_1705312200000_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "findingId": "color-contrast-0",
  "issueKey": "A11Y-123",
  "message": "Finding linked to A11Y-123"
}
```

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

**HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Server Error |

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:

- Max concurrent scans
- Requests per minute/hour
- JIRA API rate limits (typically 100 requests/minute)

---

## Examples

### cURL: Run a Scan
```bash
curl -X POST http://localhost:3001/scan/json \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "standard": "wcag21aa",
    "viewport": "desktop"
  }'
```

### cURL: Create Schedule
```bash
curl -X POST http://localhost:3001/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "frequency": "daily"
  }'
```

### JavaScript: Scan with SSE
```javascript
const eventSource = new EventSource('/scan?url=https://example.com');

eventSource.addEventListener('progress', (e) => {
  const data = JSON.parse(e.data);
  console.log(`Progress: ${data.percent}% - ${data.message}`);
});

eventSource.addEventListener('finding', (e) => {
  const finding = JSON.parse(e.data);
  console.log(`Found: ${finding.ruleTitle}`);
});

eventSource.addEventListener('complete', (e) => {
  const result = JSON.parse(e.data);
  console.log(`Scan complete! Score: ${result.score}`);
  eventSource.close();
});

eventSource.addEventListener('error', (e) => {
  console.error('Scan failed:', e.data);
  eventSource.close();
});
```

### Python: Run a Scan
```python
import requests

response = requests.post('http://localhost:3001/scan/json', json={
    'url': 'https://example.com',
    'standard': 'wcag21aa',
    'viewport': 'desktop'
})

result = response.json()
print(f"Score: {result['score']}")
print(f"Issues: {result['totalIssues']}")
```

---

## Next Steps

- [Installation](INSTALLATION.md) - Setup guide
- [Configuration](CONFIGURATION.md) - Configure settings
- [Contributing](../CONTRIBUTING.md) - Development guide