# @allylab/api

Backend API for AllyLab accessibility scanning. Built with Fastify, Playwright, and axe-core.

## Features

- 🔍 **Accessibility Scanning** - WCAG 2.0, 2.1, 2.2 compliance testing
- 🌐 **Multi-page Crawling** - Scan entire websites with configurable depth
- 🤖 **AI-Powered Fixes** - Generate fix suggestions using Claude AI
- 🔗 **GitHub Integration** - Create PRs with accessibility fixes
- 📅 **Scheduled Scans** - Automated recurring scans
- 🔔 **Webhooks** - Slack, Teams, and custom notifications
- 📊 **JIRA Integration** - Export issues to JIRA

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

### Scanning

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/scan` | Single page scan (SSE streaming) |
| `POST` | `/scan/json` | Single page scan (JSON response) |
| `POST` | `/crawl/scan` | Multi-page site scan (SSE streaming) |

### AI Fixes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/fixes/generate` | Generate AI-powered fix suggestions |

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

# AI Fixes (optional)
ANTHROPIC_API_KEY=your-api-key

# GitHub (optional)
GITHUB_API_URL=https://api.github.com

# JIRA (optional)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
JIRA_MOCK_MODE=true
```

## Project Structure
```
src/
├── config/
│   └── env.ts           # Environment configuration
├── routes/
│   ├── crawl.ts         # Multi-page scan routes
│   ├── export.ts        # Export routes
│   ├── fixes.ts         # AI fix routes
│   ├── github.ts        # GitHub integration routes
│   ├── health.ts        # Health check
│   ├── index.ts         # Route registration
│   ├── jira.ts          # JIRA integration routes
│   ├── scan-json.ts     # JSON scan route
│   ├── scan.ts          # SSE scan route
│   ├── schedules.ts     # Schedule routes
│   └── webhooks.ts      # Webhook routes
├── services/
│   ├── ai-fixes.ts      # Claude AI integration
│   ├── browser.ts       # Playwright browser management
│   ├── crawler.ts       # Site crawler
│   ├── github.ts        # GitHub API client
│   ├── scanner.ts       # axe-core scanner
│   ├── scheduler.ts     # Schedule manager
│   └── webhooks.ts      # Webhook delivery
├── types/
│   ├── fixes.ts         # AI fix types
│   ├── github.ts        # GitHub types
│   ├── index.ts         # Core types
│   ├── jira.ts          # JIRA types
│   ├── schedule.ts      # Schedule types
│   └── webhook.ts       # Webhook types
├── utils/
│   ├── scoring.ts       # Accessibility scoring
│   ├── sse.ts           # Server-Sent Events helpers
│   └── wcag.ts          # WCAG standards mapping
├── index.ts             # Entry point
└── server.ts            # Fastify server setup
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