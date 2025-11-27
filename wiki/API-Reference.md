# API Reference

Complete REST API documentation for AllyLab.

## Base URL
```
http://localhost:3001
```

## Authentication

Currently, the API does not require authentication. For production deployments, consider adding API key authentication.

---

## Quick Reference

| Category | Endpoints |
|----------|-----------|
| [Health](#health) | `GET /health` |
| [Scanning](#scanning) | `POST /scan`, `POST /scan/json`, `POST /crawl/scan` |
| [AI Fixes](#ai-fixes) | `POST /fixes/generate` |
| [Custom Rules](#custom-rules) | `GET /rules`, `POST /rules`, `PUT /rules/:id`, `DELETE /rules/:id` |
| [Historical Trends](#historical-trends) | `POST /trends`, `POST /trends/issues`, `POST /trends/compare`, `POST /trends/stats` |
| [GitHub](#github) | `POST /github/connect`, `GET /github/repos`, `POST /github/pr` |
| [Webhooks](#webhooks) | `GET /webhooks`, `POST /webhooks`, `PUT /webhooks/:id`, `DELETE /webhooks/:id` |
| [Schedules](#schedules) | `GET /schedules`, `POST /schedules`, `PATCH /schedules/:id`, `DELETE /schedules/:id` |
| [JIRA](#jira) | `POST /jira/test`, `POST /jira/create`, `POST /jira/bulk` |
| [Export](#export) | `POST /export/csv`, `POST /export/json` |

---

## Health

### GET /health

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3001/health
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

**WCAG Standards:**
- `wcag2a` - WCAG 2.0 Level A
- `wcag2aa` - WCAG 2.0 Level AA
- `wcag21a` - WCAG 2.1 Level A
- `wcag21aa` - WCAG 2.1 Level AA (recommended)
- `wcag22aa` - WCAG 2.2 Level AA

**Viewports:**
- `desktop` - 1280×720
- `tablet` - 768×1024
- `mobile` - 375×667

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

**Example:**
```bash
curl -X POST http://localhost:3001/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

---

### POST /scan/json

Start an accessibility scan and return JSON result (non-streaming).

**Request Body:** Same as `POST /scan`

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

**Example:**
```bash
curl -X POST http://localhost:3001/scan/json \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "standard": "wcag21aa",
    "viewport": "desktop"
  }'
```

---

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
data: {"urls": ["https://example.com", "https://example.com/about"], "totalFound": 5}

event: page-start
data: {"url": "https://example.com", "index": 1, "total": 5}

event: page-complete
data: {"url": "https://example.com", "score": 85, "issues": 12, "index": 1, "total": 5}

event: complete
data: {
  "pagesScanned": 5,
  "averageScore": 78,
  "totalIssues": 45,
  "critical": 5,
  "serious": 12,
  "moderate": 20,
  "minor": 8,
  "results": [...]
}
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

**Example:**
```bash
curl -X POST http://localhost:3001/crawl/scan \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "maxPages": 10,
    "maxDepth": 2
  }'
```

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
| `finding.ruleId` | string | Yes | axe-core rule ID |
| `finding.ruleTitle` | string | Yes | Rule title |
| `finding.description` | string | No | Rule description |
| `finding.html` | string | Yes | HTML snippet |
| `finding.selector` | string | Yes | CSS selector |
| `finding.wcagTags` | array | No | WCAG criteria |
| `finding.impact` | string | Yes | Severity level |
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

**Confidence Levels:**
- `high` - Very likely correct
- `medium` - Probably correct, review recommended
- `low` - May need adjustment

**Effort Levels:**
- `low` - Quick fix (< 5 minutes)
- `medium` - Moderate effort (5-30 minutes)
- `high` - Significant work (> 30 minutes)

**Example:**
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

---

## Custom Rules

### GET /rules

List all custom rules.

**Response:**
```json
{
  "success": true,
  "data": {
    "rules": [
      {
        "id": "rule-abc123",
        "name": "Skip Navigation Link",
        "description": "Page should have a skip navigation link",
        "type": "selector",
        "severity": "serious",
        "selector": "body > a[href^=\"#\"]:first-child",
        "condition": { "operator": "not-exists" },
        "message": "Add a skip to main content link",
        "helpUrl": "https://www.w3.org/WAI/WCAG21/Techniques/G1",
        "wcagTags": ["wcag2a", "wcag241"],
        "enabled": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "enabled": 1
  }
}
```

**Example:**
```bash
curl http://localhost:3001/rules
```

---

### GET /rules/:id

Get a single rule by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rule-abc123",
    "name": "Skip Navigation Link",
    "description": "Page should have a skip navigation link",
    "type": "selector",
    "severity": "serious",
    "selector": "body > a[href^=\"#\"]:first-child",
    "condition": { "operator": "not-exists" },
    "message": "Add a skip to main content link",
    "helpUrl": "https://www.w3.org/WAI/WCAG21/Techniques/G1",
    "wcagTags": ["wcag2a", "wcag241"],
    "enabled": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example:**
```bash
curl http://localhost:3001/rules/rule-abc123
```

---

### POST /rules

Create a new custom rule.

**Request Body:**
```json
{
  "name": "Skip Navigation Link",
  "description": "Page should have a skip navigation link",
  "type": "selector",
  "severity": "serious",
  "selector": "body > a[href^=\"#\"]:first-child",
  "condition": { "operator": "not-exists" },
  "message": "Add a skip to main content link",
  "helpUrl": "https://www.w3.org/WAI/WCAG21/Techniques/G1",
  "wcagTags": ["wcag2a", "wcag241"],
  "enabled": true
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Rule name |
| `type` | string | Yes | `selector`, `attribute`, `content`, or `structure` |
| `severity` | string | Yes | `critical`, `serious`, `moderate`, or `minor` |
| `selector` | string | Yes | CSS selector to check |
| `description` | string | No | Rule description |
| `condition` | object | No | Check condition |
| `condition.operator` | string | No | `exists`, `not-exists`, `equals`, `not-equals`, `contains`, `matches` |
| `condition.attribute` | string | No | Attribute to check |
| `condition.value` | string | No | Expected value |
| `message` | string | No | Error message when rule fails |
| `helpUrl` | string | No | URL to help documentation |
| `wcagTags` | array | No | WCAG success criteria tags |
| `enabled` | boolean | No | Enable/disable rule (default: true) |

**Rule Types:**

| Type | Description | Example Use |
|------|-------------|-------------|
| `selector` | Check if CSS selector exists | Skip link presence |
| `attribute` | Check element attributes | Lang attribute |
| `content` | Check text content | Empty buttons |
| `structure` | Check DOM structure | Heading hierarchy |

**Condition Operators:**

| Operator | Description |
|----------|-------------|
| `exists` | Fail if selector matches |
| `not-exists` | Fail if selector doesn't match |
| `equals` | Attribute equals value |
| `not-equals` | Attribute doesn't equal value |
| `contains` | Attribute contains value |
| `matches` | Attribute matches regex pattern |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rule-abc123",
    "name": "Skip Navigation Link",
    "type": "selector",
    "severity": "serious",
    "selector": "body > a[href^=\"#\"]:first-child",
    "condition": { "operator": "not-exists" },
    "message": "Add a skip to main content link",
    "wcagTags": ["wcag2a", "wcag241"],
    "enabled": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Skip Navigation Link",
    "type": "selector",
    "severity": "serious",
    "selector": "body > a[href^=\"#\"]:first-child",
    "condition": { "operator": "not-exists" },
    "message": "Add a skip to main content link",
    "wcagTags": ["wcag2a", "wcag241"]
  }'
```

---

### PUT /rules/:id

Update an existing rule.

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Rule Name",
  "enabled": false
}
```

**Response:** Updated rule object

**Example:**
```bash
curl -X PUT http://localhost:3001/rules/rule-abc123 \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

---

### DELETE /rules/:id

Delete a rule.

**Response:**
```json
{
  "success": true,
  "message": "Rule deleted"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3001/rules/rule-abc123
```

---

### POST /rules/test

Test a rule against sample HTML.

**Request Body:**
```json
{
  "rule": {
    "name": "Skip Navigation Link",
    "type": "selector",
    "severity": "serious",
    "selector": "body > a[href^=\"#\"]:first-child",
    "condition": { "operator": "not-exists" }
  },
  "html": "<!DOCTYPE html><html><body><p>No skip link</p></body></html>"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "violations": [
      {
        "selector": "body > a[href^=\"#\"]:first-child",
        "message": "Skip Navigation Link violation"
      }
    ],
    "passed": false
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/rules/test \
  -H "Content-Type: application/json" \
  -d '{
    "rule": {
      "name": "Skip Link",
      "type": "selector",
      "severity": "serious",
      "selector": "a[href^=\"#\"]",
      "condition": { "operator": "not-exists" }
    },
    "html": "<html><body><main>Content</main></body></html>"
  }'
```

---

### POST /rules/import

Import rules from JSON.

**Request Body:**
```json
{
  "rules": [
    {
      "name": "Rule 1",
      "type": "selector",
      "severity": "serious",
      "selector": "...",
      "condition": { "operator": "exists" }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 5,
    "total": 7
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/rules/import \
  -H "Content-Type: application/json" \
  -d '{"rules": [...]}'
```

---

### GET /rules/export

Export all rules as JSON.

**Response:**
```json
{
  "success": true,
  "data": {
    "rules": [...],
    "exportedAt": "2024-01-15T10:30:00.000Z",
    "version": "1.0"
  }
}
```

**Example:**
```bash
curl http://localhost:3001/rules/export
```

---

## Historical Trends

### POST /trends

Get score trends over time.

**Request Body:**
```json
{
  "scans": [
    {
      "id": "scan-1",
      "url": "https://example.com",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "score": 75,
      "totalIssues": 20,
      "critical": 2,
      "serious": 5,
      "moderate": 8,
      "minor": 5
    },
    {
      "id": "scan-2",
      "url": "https://example.com",
      "timestamp": "2024-01-15T00:00:00.000Z",
      "score": 82,
      "totalIssues": 15,
      "critical": 1,
      "serious": 3,
      "moderate": 7,
      "minor": 4
    }
  ],
  "url": "https://example.com",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "limit": 50
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scans` | array | Yes | Array of scan results |
| `url` | string | No | Filter by URL hostname |
| `startDate` | string | No | Start date (ISO format) |
| `endDate` | string | No | End date (ISO format) |
| `limit` | number | No | Max results (default: 50) |

**Response:**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "date": "2024-01-01T00:00:00.000Z",
        "score": 75,
        "totalIssues": 20,
        "critical": 2,
        "serious": 5,
        "moderate": 8,
        "minor": 5
      },
      {
        "date": "2024-01-15T00:00:00.000Z",
        "score": 82,
        "totalIssues": 15,
        "critical": 1,
        "serious": 3,
        "moderate": 7,
        "minor": 4
      }
    ],
    "stats": {
      "avgScore": 78,
      "minScore": 75,
      "maxScore": 82,
      "avgIssues": 17,
      "avgCritical": 1.5,
      "avgSerious": 4,
      "avgModerate": 7.5,
      "avgMinor": 4.5,
      "totalIssuesFixed": 5,
      "scoreImprovement": 7
    },
    "meta": {
      "totalScans": 2,
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-15T00:00:00.000Z"
      }
    }
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/trends \
  -H "Content-Type: application/json" \
  -d '{
    "scans": [...],
    "url": "https://example.com",
    "limit": 50
  }'
```

---

### POST /trends/issues

Get issue trends by severity.

**Request Body:** Same as `/trends`

**Response:**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "date": "2024-01-01T00:00:00.000Z",
        "critical": 2,
        "serious": 5,
        "moderate": 8,
        "minor": 5,
        "total": 20
      }
    ],
    "changeRates": {
      "scoreChangePerScan": 3.5,
      "issueChangePerScan": -2.5,
      "criticalChangePerScan": -0.5,
      "projectedScansToGoal": 3
    },
    "meta": {
      "totalScans": 2
    }
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/trends/issues \
  -H "Content-Type: application/json" \
  -d '{"scans": [...]}'
```

---

### POST /trends/compare

Compare two time periods.

**Request Body:**
```json
{
  "scans": [...],
  "period1Start": "2024-01-01T00:00:00.000Z",
  "period1End": "2024-01-31T23:59:59.000Z",
  "period2Start": "2024-02-01T00:00:00.000Z",
  "period2End": "2024-02-28T23:59:59.000Z",
  "url": "https://example.com"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scans` | array | Yes | Array of scan results |
| `period1Start` | string | Yes | Period 1 start date |
| `period1End` | string | Yes | Period 1 end date |
| `period2Start` | string | Yes | Period 2 start date |
| `period2End` | string | Yes | Period 2 end date |
| `url` | string | No | Filter by URL hostname |

**Response:**
```json
{
  "success": true,
  "data": {
    "comparison": {
      "score": {
        "period1": 75,
        "period2": 85,
        "change": 10,
        "changePercent": 13.3
      },
      "issues": {
        "period1": 20,
        "period2": 12,
        "change": -8,
        "changePercent": -40
      },
      "critical": {
        "period1": 2,
        "period2": 0,
        "change": -2
      },
      "serious": {
        "period1": 5,
        "period2": 3,
        "change": -2
      },
      "scanCount": {
        "period1": 4,
        "period2": 4
      }
    },
    "period1": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-31T23:59:59.000Z",
      "stats": { ... }
    },
    "period2": {
      "start": "2024-02-01T00:00:00.000Z",
      "end": "2024-02-28T23:59:59.000Z",
      "stats": { ... }
    }
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/trends/compare \
  -H "Content-Type: application/json" \
  -d '{
    "scans": [...],
    "period1Start": "2024-01-01",
    "period1End": "2024-01-31",
    "period2Start": "2024-02-01",
    "period2End": "2024-02-28"
  }'
```

---

### POST /trends/stats

Get aggregate statistics.

**Request Body:** Same as `/trends`

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "avgScore": 78,
      "minScore": 65,
      "maxScore": 92,
      "avgIssues": 15,
      "avgCritical": 1,
      "avgSerious": 3,
      "avgModerate": 7,
      "avgMinor": 4,
      "totalIssuesFixed": 25,
      "scoreImprovement": 15
    },
    "percentiles": {
      "p25": 72,
      "p50": 78,
      "p75": 85,
      "p90": 90
    },
    "changeRates": {
      "scoreChangePerScan": 1.5,
      "issueChangePerScan": -1.2,
      "criticalChangePerScan": -0.1,
      "projectedScansToGoal": 8
    },
    "bestScan": {
      "date": "2024-01-20T00:00:00.000Z",
      "score": 92,
      "url": "https://example.com"
    },
    "worstScan": {
      "date": "2024-01-05T00:00:00.000Z",
      "score": 65,
      "url": "https://example.com"
    },
    "meta": {
      "totalScans": 20,
      "uniqueUrls": 3
    }
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/trends/stats \
  -H "Content-Type: application/json" \
  -d '{"scans": [...]}'
```

---

## GitHub

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

**Example:**
```bash
curl -X POST http://localhost:3001/github/connect \
  -H "Content-Type: application/json" \
  -d '{"token": "ghp_xxxx"}'
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

**Example:**
```bash
curl -X POST http://localhost:3001/github/disconnect
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

**Example:**
```bash
curl http://localhost:3001/github/status
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

**Example:**
```bash
curl http://localhost:3001/github/repos
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

**Example:**
```bash
curl http://localhost:3001/github/repos/username/my-repo/branches
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

**Example:**
```bash
curl "http://localhost:3001/github/repos/username/my-repo/file?path=src/App.tsx&branch=main"
```

---

### GET /github/repos/:owner/:repo/pulls/:prNumber

Get pull request status.

**Response:**
```json
{
  "number": 42,
  "state": "open",
  "title": "[AllyLab] Fix accessibility issues",
  "html_url": "https://github.com/username/my-repo/pull/42",
  "merged": false,
  "mergeable": true,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T11:00:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3001/github/repos/username/my-repo/pulls/42
```

---

### POST /github/pr

Create a pull request with accessibility fixes. Supports both single fix and batch fixes.

**Request Body:**
```json
{
  "owner": "username",
  "repo": "my-website",
  "baseBranch": "main",
  "title": "[AllyLab] Fix 3 accessibility issues",
  "description": "Optional PR description",
  "fixes": [
    {
      "filePath": "src/components/Hero.tsx",
      "originalContent": "<img src=\"hero.jpg\">",
      "fixedContent": "<img src=\"hero.jpg\" alt=\"Hero banner\" />",
      "findingId": "image-alt-0",
      "ruleTitle": "Images must have alternate text"
    },
    {
      "filePath": "src/components/Button.tsx",
      "originalContent": "<button></button>",
      "fixedContent": "<button aria-label=\"Submit\"></button>",
      "findingId": "button-name-0",
      "ruleTitle": "Buttons must have discernible text"
    }
  ]
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `owner` | string | Yes | Repository owner |
| `repo` | string | Yes | Repository name |
| `baseBranch` | string | Yes | Base branch for PR |
| `title` | string | No | PR title (auto-generated if not provided) |
| `description` | string | No | PR description (auto-generated if not provided) |
| `fixes` | array | Yes | Array of fixes to apply |
| `fixes[].filePath` | string | Yes | Path to file in repository |
| `fixes[].originalContent` | string | Yes | Original code |
| `fixes[].fixedContent` | string | Yes | Fixed code |
| `fixes[].findingId` | string | Yes | Finding identifier |
| `fixes[].ruleTitle` | string | Yes | Accessibility rule title |

**Response:**
```json
{
  "success": true,
  "prNumber": 42,
  "prUrl": "https://github.com/username/my-website/pull/42",
  "branchName": "allylab/a11y-fixes-1705312200000"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "File not found: src/components/Hero.tsx"
}
```

**Example (Single Fix):**
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
      "fixedContent": "<img src=\"hero.jpg\" alt=\"Hero\" />",
      "findingId": "image-alt-0",
      "ruleTitle": "Images must have alternate text"
    }]
  }'
```

**Example (Batch Fixes):**
```bash
curl -X POST http://localhost:3001/github/pr \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "username",
    "repo": "my-repo",
    "baseBranch": "main",
    "title": "[AllyLab] Fix 2 accessibility issues",
    "fixes": [
      {
        "filePath": "src/Hero.tsx",
        "originalContent": "<img src=\"hero.jpg\">",
        "fixedContent": "<img src=\"hero.jpg\" alt=\"Hero\" />",
        "findingId": "image-alt-0",
        "ruleTitle": "Images must have alternate text"
      },
      {
        "filePath": "src/Button.tsx",
        "originalContent": "<button></button>",
        "fixedContent": "<button aria-label=\"Submit\"></button>",
        "findingId": "button-name-0",
        "ruleTitle": "Buttons must have discernible text"
      }
    ]
  }'
```

---

### POST /github/verify

Verify fixes by re-scanning after PR merge.

**Request Body:**
```json
{
  "url": "https://example.com",
  "findingIds": ["image-alt-0", "button-name-0"]
}
```

**Response:**
```json
{
  "success": true,
  "verified": ["image-alt-0"],
  "stillPresent": ["button-name-0"],
  "newScore": 88
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/github/verify \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "findingIds": ["image-alt-0"]
  }'
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

**Example:**
```bash
curl http://localhost:3001/webhooks
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
| `type` | string | No | `slack`, `teams`, or `generic` (auto-detected from URL) |
| `events` | array | No | Events to trigger on |
| `enabled` | boolean | No | Enable/disable webhook |

**Webhook Types:**

| Type | URL Pattern | Format |
|------|-------------|--------|
| `slack` | `hooks.slack.com` | Block Kit |
| `teams` | `webhook.office.com` | Adaptive Cards |
| `generic` | Any other | JSON |

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

**Example:**
```bash
curl -X POST http://localhost:3001/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack Alerts",
    "url": "https://hooks.slack.com/services/xxx/yyy/zzz"
  }'
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

**Example:**
```bash
curl -X PUT http://localhost:3001/webhooks/wh_123 \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

---

### DELETE /webhooks/:id

Delete a webhook.

**Response:**
```json
{
  "success": true
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3001/webhooks/wh_123
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

**Example:**
```bash
curl -X POST http://localhost:3001/webhooks/wh_123/test
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

**Example:**
```bash
curl http://localhost:3001/schedules
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

**Frequency Details:**

| Frequency | Interval |
|-----------|----------|
| `hourly` | Every hour |
| `daily` | Every 24 hours |
| `weekly` | Every 7 days |
| `monthly` | Every 30 days |

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

**Example:**
```bash
curl -X POST http://localhost:3001/schedules \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "frequency": "daily"}'
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

**Example:**
```bash
curl http://localhost:3001/schedules/sch_123
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

**Example:**
```bash
curl -X PATCH http://localhost:3001/schedules/sch_123 \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

---

### DELETE /schedules/:id

Delete a schedule.

**Response:**
```json
{
  "success": true
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3001/schedules/sch_123
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

**Example:**
```bash
curl -X POST http://localhost:3001/schedules/sch_123/run
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

**Example:**
```bash
curl http://localhost:3001/schedules/sch_123/history
```

---

## JIRA

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

**Example:**
```bash
curl -X POST http://localhost:3001/jira/test
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

**Example:**
```bash
curl -X POST http://localhost:3001/jira/create \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": { "key": "A11Y" },
      "issuetype": { "name": "Bug" },
      "summary": "[A11Y] Missing alt text",
      "description": "Image is missing alt text"
    }
  }'
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

**Example:**
```bash
curl -X POST http://localhost:3001/jira/bulk \
  -H "Content-Type: application/json" \
  -d '{"issues": [...]}'
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

**Example:**
```bash
curl http://localhost:3001/jira/issue/A11Y-123
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

**Example:**
```bash
curl -X POST http://localhost:3001/jira/link \
  -H "Content-Type: application/json" \
  -d '{
    "findingId": "color-contrast-0",
    "issueKey": "A11Y-123"
  }'
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

**Response:** CSV file (text/csv)

**Example:**
```bash
curl -X POST http://localhost:3001/export/csv \
  -H "Content-Type: application/json" \
  -d '{"findings": [...]}' \
  -o report.csv
```

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

**Response:** JSON file (application/json)

**Example:**
```bash
curl -X POST http://localhost:3001/export/json \
  -H "Content-Type: application/json" \
  -d '{"findings": [...]}' \
  -o report.json
```

---

## Error Handling

### Error Response Format

All endpoints return errors in this format:
```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal error |

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid URL` | Malformed URL | Check URL format |
| `Navigation timeout` | Site too slow | Retry or check site |
| `Not Found` | Invalid ID | Check resource exists |
| `GitHub: Bad credentials` | Invalid token | Regenerate token |
| `JIRA: Unauthorized` | Invalid credentials | Check API token |

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:

| Resource | Recommended Limit |
|----------|-------------------|
| Scans | 100 per hour |
| API requests | 1000 per minute |
| GitHub API | 5000 per hour (authenticated) |
| JIRA API | 100 per minute |

---

## SDKs & Examples

### JavaScript/TypeScript
```typescript
const response = await fetch('http://localhost:3001/scan/json', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    standard: 'wcag21aa'
  })
});

const result = await response.json();
console.log(`Score: ${result.score}`);
```

### Python
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

### SSE Streaming (JavaScript)
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
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data);
    }
  }
}
```

### cURL Examples
```bash
# Health check
curl http://localhost:3001/health

# Single page scan
curl -X POST http://localhost:3001/scan/json \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Site scan
curl -X POST http://localhost:3001/crawl/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "maxPages": 10}'

# Generate AI fix
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
    }
  }'

# Create custom rule
curl -X POST http://localhost:3001/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Skip Link",
    "type": "selector",
    "severity": "serious",
    "selector": "a[href^=\"#\"]",
    "condition": {"operator": "not-exists"}
  }'

# Create webhook
curl -X POST http://localhost:3001/webhooks \
  -H "Content-Type: application/json" \
  -d '{"name": "Slack", "url": "https://hooks.slack.com/..."}'

# Create GitHub PR
curl -X POST http://localhost:3001/github/pr \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "username",
    "repo": "my-repo",
    "baseBranch": "main",
    "fixes": [{
      "filePath": "src/App.tsx",
      "originalContent": "<img src=\"x\">",
      "fixedContent": "<img src=\"x\" alt=\"\" />"
    }]
  }'
```

---

## Related Documentation

- [[Getting Started]] - Installation and first scan
- [[Features]] - Complete feature overview
- [[Custom Rules]] - Creating custom checks
- [[Historical Trends]] - Tracking progress over time
- [[Integrations]] - GitHub, JIRA, Slack, Teams
- [[CI/CD Integration]] - Pipeline setup
- [[Configuration]] - Environment variables and settings