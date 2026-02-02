# @allylab/api

Backend API for AllyLab accessibility scanning. Built with Fastify, Playwright, and axe-core.

## Features

- 🔍 **Accessibility Scanning** - WCAG 2.0, 2.1, 2.2 compliance testing
- 🌐 **Multi-page Crawling** - Scan entire websites with configurable depth
- 🤖 **AI-Powered Fixes** - Generate fix suggestions using Claude AI
- 🔗 **GitHub/GitLab Integration** - Create PRs/MRs with accessibility fixes
- 📅 **Scheduled Scans** - Automated recurring scans
- 🔔 **Webhooks** - Slack, Teams, and custom notifications
- 📊 **JIRA Integration** - Export issues to JIRA
- 📏 **Custom Rules** - Create and manage custom accessibility rules
- 📈 **Historical Trends** - Track score and issue trends over time
- 📊 **Prometheus Metrics** - Built-in observability with `/metrics` endpoint
- 🔄 **Graceful Shutdown** - Clean resource cleanup on SIGINT/SIGTERM
- ⚡ **Rate Limiting** - Configurable request throttling

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Start development server
npm run dev
```

The API will be available at `http://localhost:3001`.

### Health Check
```bash
curl http://localhost:3001/health
```

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Prometheus metrics |

### Scanning

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/scan` | Single page scan (SSE streaming) |
| `POST` | `/scan/json` | Single page scan (JSON response) |
| `POST` | `/crawl/scan` | Multi-page site scan (SSE streaming) |

### AI Fixes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/fixes/generate` | Generate AI-powered fix suggestions |

### Custom Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/rules` | List all custom rules |
| `GET` | `/rules/:id` | Get a single rule |
| `POST` | `/rules` | Create a new rule |
| `PUT` | `/rules/:id` | Update a rule |
| `DELETE` | `/rules/:id` | Delete a rule |
| `POST` | `/rules/test` | Test a rule against HTML |
| `POST` | `/rules/import` | Import rules from JSON |
| `GET` | `/rules/export` | Export all rules as JSON |

### Historical Trends

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/trends` | Get score trends over time |
| `POST` | `/trends/issues` | Get issue trends by severity |
| `POST` | `/trends/compare` | Compare two time periods |
| `POST` | `/trends/stats` | Get aggregate statistics |

### GitHub

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/github/connect` | Connect GitHub account with token |
| `POST` | `/github/disconnect` | Disconnect GitHub account |
| `GET` | `/github/status` | Check connection status |
| `GET` | `/github/repos` | List user repositories |
| `GET` | `/github/repos/:owner/:repo/branches` | List repository branches |
| `GET` | `/github/repos/:owner/:repo/file` | Get file content |
| `POST` | `/github/pr` | Create pull request with fixes |

### GitLab

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/gitlab/connection` | Check GitLab connection status |
| `POST` | `/gitlab/connection` | Connect GitLab account with token |
| `DELETE` | `/gitlab/connection` | Disconnect GitLab account |
| `POST` | `/gitlab/mr` | Create merge request with fixes |
| `GET` | `/gitlab/mr` | Get merge request status |

> **Note:** GitLab integration supports both GitLab.com and self-hosted GitLab instances via the `instanceUrl` parameter.

### Schedules

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/schedules` | List all schedules |
| `POST` | `/schedules` | Create a schedule |
| `PATCH` | `/schedules/:id` | Update a schedule |
| `DELETE` | `/schedules/:id` | Delete a schedule |
| `POST` | `/schedules/:id/run` | Run schedule immediately |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/webhooks` | List all webhooks |
| `POST` | `/webhooks` | Create a webhook |
| `PUT` | `/webhooks/:id` | Update a webhook |
| `DELETE` | `/webhooks/:id` | Delete a webhook |
| `POST` | `/webhooks/:id/test` | Test a webhook |

### JIRA

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/jira/test` | Test JIRA connection |
| `POST` | `/jira/create` | Create single issue |
| `POST` | `/jira/bulk` | Create multiple issues |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/export/csv` | Export findings to CSV |
| `POST` | `/export/json` | Export findings to JSON |

## Example Requests

### Single Page Scan
```bash
curl -X POST http://localhost:3001/scan/json \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "standard": "wcag21aa",
    "viewport": "desktop"
  }'
```

### Site Scan (SSE)
```bash
curl -X POST http://localhost:3001/crawl/scan \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "maxPages": 10,
    "maxDepth": 2,
    "standard": "wcag21aa"
  }'
```

### Generate AI Fix
```bash
curl -X POST http://localhost:3001/fixes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "finding": {
      "ruleId": "image-alt",
      "ruleTitle": "Images must have alternate text",
      "description": "Missing alt attribute",
      "html": "<img src=\"hero.jpg\">",
      "selector": "img.hero",
      "wcagTags": ["wcag111"],
      "impact": "critical"
    }
  }'
```

### Create Custom Rule
```bash
curl -X POST http://localhost:3001/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Skip Navigation Link",
    "description": "Page should have a skip navigation link",
    "type": "selector",
    "severity": "serious",
    "selector": "body > a[href^=\"#\"]:first-child",
    "condition": { "operator": "not-exists" },
    "message": "Add a skip to main content link",
    "wcagTags": ["wcag2a", "wcag241"]
  }'
```

### Get Historical Trends
```bash
curl -X POST http://localhost:3001/trends \
  -H "Content-Type: application/json" \
  -d '{
    "scans": [
      {"id": "1", "url": "https://example.com", "timestamp": "2024-01-01", "score": 75, "totalIssues": 20, "critical": 2, "serious": 5, "moderate": 8, "minor": 5},
      {"id": "2", "url": "https://example.com", "timestamp": "2024-01-15", "score": 82, "totalIssues": 15, "critical": 1, "serious": 3, "moderate": 7, "minor": 4}
    ],
    "url": "https://example.com",
    "limit": 50
  }'
```

### Compare Time Periods
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

### Create GitHub PR
```bash
curl -X POST http://localhost:3001/github/pr \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "username",
    "repo": "my-repo",
    "baseBranch": "main",
    "fixes": [{
      "filePath": "src/components/Hero.tsx",
      "originalContent": "<img src=\"hero.jpg\">",
      "fixedContent": "<img src=\"hero.jpg\" alt=\"Hero banner\">",
      "findingId": "finding-123",
      "ruleTitle": "Images must have alternate text"
    }]
  }'
```

## Configuration

### Environment Variables

Create a `.env` file:
```env
# Server
PORT=3001
NODE_ENV=development

# Rate Limiting (optional)
ENABLE_RATE_LIMITING=false
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000

# AI Fixes (optional)
ANTHROPIC_API_KEY=your-api-key
ENABLE_AI_FIXES=true

# GitHub (optional)
GITHUB_API_URL=https://api.github.com

# JIRA (optional)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
JIRA_MOCK_MODE=true
```

### Observability

- **Metrics:** `GET /metrics` returns Prometheus-format metrics
- **Health:** `GET /health` returns server status
- **Logging:** Structured JSON logs with request ID correlation
- **Request ID:** Automatic `X-Request-ID` header for tracing

## Project Structure
```
src/
├── config/
│   ├── env.ts           # Environment configuration with validation
│   └── swagger.ts       # OpenAPI documentation config
├── interfaces/
│   └── storage.ts       # IStorage interface for database abstraction
├── routes/
│   ├── crawl.ts         # Multi-page scan routes
│   ├── export.ts        # Export routes
│   ├── fixes.ts         # AI fix routes
│   ├── github.ts        # GitHub integration routes
│   ├── health.ts        # Health check & metrics
│   ├── index.ts         # Route registration
│   ├── jira.ts          # JIRA integration routes
│   ├── rules.ts         # Custom rules routes (with pagination)
│   ├── scan-json.ts     # JSON scan route
│   ├── scan.ts          # SSE scan route
│   ├── schedules.ts     # Schedule routes (with pagination)
│   ├── trends.ts        # Historical trends routes
│   └── webhooks.ts      # Webhook routes (with pagination)
├── services/
│   ├── ai-fixes.ts      # Claude AI integration
│   ├── browser.ts       # Playwright browser pool management
│   ├── crawler.ts       # Site crawler with depth control
│   ├── github.ts        # GitHub API client
│   ├── scanner.ts       # axe-core scanner
│   ├── scheduler.ts     # Cron-based schedule manager
│   └── webhooks.ts      # Webhook delivery with retries
├── types/
│   ├── fixes.ts         # AI fix types
│   ├── github.ts        # GitHub types
│   ├── index.ts         # Core types
│   ├── jira.ts          # JIRA types
│   ├── rules.ts         # Custom rules types
│   ├── schedule.ts      # Schedule types
│   └── webhook.ts       # Webhook types
├── utils/
│   ├── errors.ts        # Standardized error handling
│   ├── logger.ts        # Pino structured logging
│   ├── metrics.ts       # Prometheus metrics
│   ├── pagination.ts    # List pagination helpers
│   ├── scoring.ts       # Accessibility score calculation
│   ├── sse.ts           # Server-Sent Events helpers
│   ├── storage.ts       # JSON file storage (implements IStorage)
│   └── wcag.ts          # WCAG standards mapping
├── index.ts             # Entry point
└── server.ts            # Fastify server with graceful shutdown
```

## Docker

### Build
```bash
docker build -t allylab-api .
```

### Run
```bash
docker run -d \
  --name allylab-api \
  -p 3001:3001 \
  -e ANTHROPIC_API_KEY=your-key \
  allylab-api
```

## Development
```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type check
npm run typecheck

# Lint
npm run lint
```

## License

MIT