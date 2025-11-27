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

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rule-abc123",
    "name": "Skip Navigation Link",
    ...
  }
}
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
      ...
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
  ]
}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
  "period2End": "2024-02-28T23:59:59.000Z"
}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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