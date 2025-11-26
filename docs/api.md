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
| Site Scan | `POST` | `/crawl/scan` | Multi-page site scan (SSE) |
| AI Fixes | `POST` | `/fixes/generate` | Generate AI fix suggestions |
| GitHub | `POST` | `/github/connect` | Connect GitHub account |
| GitHub | `POST` | `/github/disconnect` | Disconnect GitHub account |
| GitHub | `GET` | `/github/status` | Check connection status |
| GitHub | `GET` | `/github/repos` | List repositories |
| GitHub | `GET` | `/github/repos/:owner/:repo/branches` | List branches |
| GitHub | `GET` | `/github/repos/:owner/:repo/file` | Get file content |
| GitHub | `POST` | `/github/pr` | Create pull request |
| Webhooks | `GET` | `/webhooks` | List webhooks |
| Webhooks | `POST` | `/webhooks` | Create webhook |
| Webhooks | `PUT` | `/webhooks/:id` | Update webhook |
| Webhooks | `DELETE` | `/webhooks/:id` | Delete webhook |
| Webhooks | `POST` | `/webhooks/:id/test` | Test webhook |
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
| Export | `POST` | `/export/csv` | Export to CSV |
| Export | `POST` | `/export/json` | Export to JSON |

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

---

## Site Scanning (Multi-Page)

### POST /crawl/scan

Crawl and scan multiple pages across a website with SSE streaming.

**Request Body:**
```json
{
  "url": "https://example.com",
  "maxPages": 10,
  "maxDepth": 2,
  "standard": "wcag21aa"
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | string | Yes | - | Starting URL |
| `maxPages` | number | No | `10` | Maximum pages to scan |
| `maxDepth` | number | No | `2` | Maximum crawl depth |
| `standard` | string | No | `wcag21aa` | WCAG standard |

**Response:** Server-Sent Events stream
```
event: status
data: {"message": "Discovering pages...", "phase": "crawl"}

event: crawl-complete
data: {"urls": ["https://example.com", "https://example.com/about", ...], "totalFound": 5}

event: page-start
data: {"url": "https://example.com", "index": 1, "total": 5}

event: page-complete
data: {"url": "https://example.com", "score": 85, "issues": 12, "index": 1, "total": 5}

event: complete
data: {"pagesScanned": 5, "averageScore": 78, "totalIssues": 45, "critical": 5, "serious": 12, "moderate": 20, "minor": 8, "results": [...]}
```

**Event Types:**

| Event | Description |
|-------|-------------|
| `status` | Status update with phase |
| `crawl-complete` | Crawling finished, URLs discovered |
| `page-start` | Starting to scan a page |
| `page-complete` | Finished scanning a page |
| `complete` | All pages scanned |
| `error` | Scan failed |

---

## AI Fixes

### POST /fixes/generate

Generate AI-powered fix suggestions for an accessibility issue.

**Request Body:**
```json
{
  "finding": {
    "ruleId": "image-alt",
    "ruleTitle": "Images must have alternate text",
    "description": "Ensures <img> elements have alternate text or a role of none or presentation",
    "html": "<img src=\"hero.jpg\" class=\"hero-image\">",
    "selector": "img.hero-image",
    "wcagTags": ["wcag111", "wcag244"],
    "impact": "critical"
  },
  "framework": "react",
  "context": "This is a hero banner image on the homepage"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `finding` | object | Yes | The accessibility finding |
| `framework` | string | No | Target framework: `html`, `react`, `vue`, `angular` |
| `context` | string | No | Additional context about the element |

**Response:**
```json
{
  "success": true,
  "fix": {
    "original": {
      "code": "<img src=\"hero.jpg\" class=\"hero-image\">",
      "language": "jsx"
    },
    "suggested": {
      "code": "<img src=\"hero.jpg\" className=\"hero-image\" alt=\"Hero banner showcasing our product\" />",
      "language": "jsx"
    },
    "explanation": "Added descriptive alt text to convey the image's purpose to screen reader users. For decorative images, use alt=\"\" instead.",
    "confidence": "high",
    "effort": "low",
    "wcagCriteria": ["1.1.1 Non-text Content"],
    "diff": "- <img src=\"hero.jpg\" class=\"hero-image\">\n+ <img src=\"hero.jpg\" className=\"hero-image\" alt=\"Hero banner showcasing our product\" />"
  }
}
```

---

## GitHub Integration

### POST /github/connect

Connect a GitHub account using a Personal Access Token.

**Request Body:**
```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "login": "username",
    "name": "John Doe",
    "avatar_url": "https://avatars.githubusercontent.com/u/123456"
  }
}
```

---

### POST /github/disconnect

Disconnect the GitHub account.

**Response:**
```json
{
  "success": true
}
```

---

### GET /github/status

Check GitHub connection status.

**Response (Connected):**
```json
{
  "connected": true,
  "user": {
    "login": "username",
    "name": "John Doe",
    "avatar_url": "https://avatars.githubusercontent.com/u/123456"
  }
}
```

**Response (Not Connected):**
```json
{
  "connected": false
}
```

---

### GET /github/repos

List repositories the user has access to.

**Response:**
```json
{
  "repos": [
    {
      "id": 123456,
      "name": "my-website",
      "full_name": "username/my-website",
      "private": false,
      "default_branch": "main",
      "html_url": "https://github.com/username/my-website"
    }
  ]
}
```

---

### GET /github/repos/:owner/:repo/branches

List branches for a repository.

**Response:**
```json
{
  "branches": [
    { "name": "main", "protected": true },
    { "name": "develop", "protected": false },
    { "name": "feature/new-feature", "protected": false }
  ]
}
```

---

### GET /github/repos/:owner/:repo/file

Get file content from a repository.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | File path in repository |
| `branch` | string | No | Branch name (default: default branch) |

**Response:**
```json
{
  "content": "file content here...",
  "sha": "abc123def456",
  "path": "src/components/Hero.tsx",
  "encoding": "utf-8"
}
```

---

### POST /github/pr

Create a pull request with accessibility fixes.

**Request Body:**
```json
{
  "owner": "username",
  "repo": "my-website",
  "baseBranch": "main",
  "title": "fix(a11y): Add alt text to hero image",
  "body": "## Accessibility Fix\n\nThis PR fixes the following accessibility issue:\n- Images must have alternate text",
  "fixes": [
    {
      "filePath": "src/components/Hero.tsx",
      "originalContent": "<img src=\"hero.jpg\">",
      "fixedContent": "<img src=\"hero.jpg\" alt=\"Hero banner\" />",
      "findingId": "image-alt-0",
      "ruleTitle": "Images must have alternate text"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "pullRequest": {
    "number": 42,
    "html_url": "https://github.com/username/my-website/pull/42",
    "title": "fix(a11y): Add alt text to hero image",
    "state": "open",
    "head": {
      "ref": "a11y-fix-1705312200000"
    }
  }
}
```

---

## Webhooks

### GET /webhooks

List all configured webhooks.

**Response:**
```json
{
  "webhooks": [
    {
      "id": "wh_123",
      "name": "Slack Notifications",
      "url": "https://hooks.slack.com/services/xxx/yyy/zzz",
      "type": "slack",
      "enabled": true,
      "events": ["scan.complete"],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### POST /webhooks

Create a new webhook.

**Request Body:**
```json
{
  "name": "Slack Notifications",
  "url": "https://hooks.slack.com/services/xxx/yyy/zzz",
  "type": "slack",
  "events": ["scan.complete"],
  "enabled": true
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Webhook name |
| `url` | string | Yes | Webhook URL |
| `type` | string | No | `slack`, `teams`, or `generic` (auto-detected) |
| `events` | array | No | Events to trigger on |
| `enabled` | boolean | No | Enable/disable webhook |

**Response:**
```json
{
  "id": "wh_123",
  "name": "Slack Notifications",
  "url": "https://hooks.slack.com/services/xxx/yyy/zzz",
  "type": "slack",
  "enabled": true,
  "events": ["scan.complete"],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### PUT /webhooks/:id

Update a webhook.

**Request Body:**
```json
{
  "name": "Updated Name",
  "enabled": false
}
```

**Response:** Updated webhook object

---

### DELETE /webhooks/:id

Delete a webhook.

**Response:**
```json
{
  "success": true
}
```

---

### POST /webhooks/:id/test

Send a test notification to a webhook.

**Response:**
```json
{
  "success": true,
  "message": "Test notification sent"
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

Get a JIRA issue.

**Response:**
```json
{
  "key": "A11Y-123",
  "fields": {
    "summary": "[A11Y] Color contrast issue",
    "project": { "key": "A11Y" },
    "issuetype": { "name": "Bug" },
    "status": { "name": "Open" }
  }
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

## Export

### POST /export/csv

Export findings to CSV format.

**Request Body:**
```json
{
  "findings": [...],
  "scanUrl": "https://example.com",
  "scanDate": "2024-01-15T10:30:00.000Z"
}
```

**Response:** CSV file download

---

### POST /export/json

Export findings to JSON format.

**Request Body:**
```json
{
  "findings": [...],
  "scanUrl": "https://example.com",
  "scanDate": "2024-01-15T10:30:00.000Z"
}
```

**Response:** JSON file download

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
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Server Error |

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:

- Max concurrent scans
- Requests per minute/hour
- GitHub API rate limits (5000 requests/hour authenticated)
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

### cURL: Site Scan
```bash
curl -X POST http://localhost:3001/crawl/scan \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "maxPages": 10,
    "maxDepth": 2
  }'
```

### cURL: Generate AI Fix
```bash
curl -X POST http://localhost:3001/fixes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "finding": {
      "ruleId": "image-alt",
      "ruleTitle": "Images must have alternate text",
      "html": "<img src=\"hero.jpg\">",
      "selector": "img.hero",
      "wcagTags": ["wcag111"],
      "impact": "critical"
    },
    "framework": "react"
  }'
```

### cURL: Create GitHub PR
```bash
curl -X POST http://localhost:3001/github/pr \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "username",
    "repo": "my-repo",
    "baseBranch": "main",
    "fixes": [{
      "filePath": "src/Hero.tsx",
      "originalContent": "<img src=\"hero.jpg\">",
      "fixedContent": "<img src=\"hero.jpg\" alt=\"Hero\" />"
    }]
  }'
```

### cURL: Create Webhook
```bash
curl -X POST http://localhost:3001/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack Alerts",
    "url": "https://hooks.slack.com/services/xxx/yyy/zzz",
    "type": "slack"
  }'
```

### JavaScript: Scan with SSE
```javascript
const response = await fetch('http://localhost:3001/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Parse SSE events
  console.log(chunk);
}
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

### CLI: Command Line Scanning
```bash
# Single page scan
allylab scan https://example.com

# Site scan
allylab site https://example.com --max-pages 10

# CI/CD mode
allylab scan https://example.com --fail-on critical --format json
```

---

## Next Steps

- [Installation](INSTALLATION.md) - Setup guide
- [Configuration](CONFIGURATION.md) - Configure settings
- [Contributing](../CONTRIBUTING.md) - Development guide