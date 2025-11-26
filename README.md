<div align="center">
  <h1>🔬 AllyLab</h1>
  <p><strong>Enterprise-grade web accessibility scanner with AI-powered fix suggestions</strong></p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#cli">CLI</a> •
    <a href="#documentation">Documentation</a> •
    <a href="#api">API</a> •
    <a href="#contributing">Contributing</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/WCAG-2.2%20AA-green" alt="WCAG 2.2 AA">
    <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License">
    <img src="https://img.shields.io/badge/TypeScript-5.3-blue" alt="TypeScript">
    <img src="https://img.shields.io/badge/React-19-blue" alt="React 19">
  </p>
</div>

---

## ✨ Features

### 🔍 Comprehensive Scanning
- **WCAG 2.0, 2.1, 2.2** compliance testing (A, AA levels)
- **Multi-viewport** testing (Desktop, Tablet, Mobile)
- **Multi-page site scanning** with automatic crawling
- **Real-time streaming** results via Server-Sent Events
- Powered by [axe-core](https://github.com/dequelabs/axe-core) and [Playwright](https://playwright.dev/)

### 💻 CLI Tool
- **Command-line scanning** for CI/CD integration
- Single page and multi-page site scans
- JSON, summary, or pretty output formats
- Fail thresholds for automated pipelines
- Works with any CI system (GitHub Actions, GitLab CI, Jenkins, etc.)
```bash
# Install globally
npm install -g @allylab/cli

# Scan a single page
allylab scan https://example.com

# Scan entire site
allylab site https://example.com --max-pages 10

# CI/CD mode - fail on critical issues
allylab scan https://example.com --fail-on critical --format json
```

### 📊 Executive Dashboard
- High-level accessibility overview across all sites
- Score trends and historical tracking
- Top issues by frequency
- Site rankings with grade cards (A-F)
- **PDF export** for stakeholder reporting

### 🔄 Issue Tracking
- Automatic fingerprinting to track issues across scans
- **New / Recurring / Fixed** status detection
- False positive management
- Issue patterns analysis (component-level, global, template-based)

### 🤖 AI-Powered One-Click Fixes
- **Contextual fix suggestions** using Claude AI
- **Framework-specific code** (HTML, React, Vue)
- **GitHub PR integration** - create pull requests directly
- Confidence levels and effort estimates
- Unified diff view for code changes

### 🔗 GitHub Integration
- Connect with GitHub Personal Access Token
- **Automatic PR creation** with accessibility fixes
- Branch creation and file updates
- Works with any repository you have access to

### 📅 Scheduled Scans
- Automated recurring scans (hourly, daily, weekly, monthly)
- Score history and trend tracking
- Run scans on-demand

### 🔔 Notifications
- **Slack integration** with Block Kit formatting
- **Microsoft Teams** with Adaptive Cards
- Webhook notifications on scan completion
- Color-coded severity indicators

### 🔗 JIRA Integration
- Export issues directly to JIRA
- Custom field mapping (severity → priority)
- Bulk issue creation (up to 1000 at once)
- Link findings to existing JIRA issues

### 🏆 Competitor Benchmarking
- Compare accessibility scores across competitors
- Side-by-side analysis
- Track improvements over time

### 🔧 CI/CD Integration
- Generate pipeline configs for **GitHub Actions**, **GitLab CI**, **Harness**
- Fail builds on critical/serious issues
- Configurable score thresholds

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** 9+

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/allylab.git
cd allylab

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Running Locally
```bash
# Start both API and Dashboard
npm run dev

# Or run separately:
npm run dev:api      # API on http://localhost:3001
npm run dev:dashboard # Dashboard on http://localhost:5173
```

### Your First Scan

1. Open http://localhost:5173
2. Enter a URL (e.g., `https://example.com`)
3. Click **Scan Page**
4. View results with severity breakdown, findings, and fix suggestions

---

## 💻 CLI

The AllyLab CLI enables accessibility scanning from the command line, perfect for CI/CD pipelines.

### Installation
```bash
# Install globally
npm install -g @allylab/cli

# Or use npx
npx @allylab/cli scan https://example.com
```

### Commands

#### Single Page Scan
```bash
allylab scan <url> [options]

Options:
  -s, --standard <standard>  WCAG standard (wcag21aa, wcag22aa, wcag21a)
  -v, --viewport <viewport>  Viewport size (desktop, tablet, mobile)
  -f, --fail-on <severity>   Exit code 1 if issues found (critical, serious, moderate, minor)
  --format <format>          Output format (pretty, json, summary)
  -o, --output <file>        Write results to file
  --api-url <url>            API server URL (default: http://localhost:3001)
```

#### Multi-Page Site Scan
```bash
allylab site <url> [options]

Options:
  -p, --max-pages <number>   Maximum pages to scan (default: 10)
  -d, --max-depth <number>   Maximum crawl depth (default: 2)
  -s, --standard <standard>  WCAG standard
  -f, --fail-on <severity>   Exit code 1 if issues found
  --format <format>          Output format (pretty, json, summary)
  -o, --output <file>        Write results to file
```

### Examples
```bash
# Basic scan
allylab scan https://example.com

# Scan with WCAG 2.2 AA standard
allylab scan https://example.com --standard wcag22aa

# Site scan with 20 pages max
allylab site https://example.com --max-pages 20 --max-depth 3

# CI/CD mode - fail pipeline on critical issues
allylab scan https://example.com --fail-on critical --format json

# Save results to file
allylab scan https://example.com --format json --output report.json
```

### CI/CD Integration

#### GitHub Actions
```yaml
name: Accessibility Check
on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Start AllyLab API
        run: |
          npm install
          npm run dev:api &
          sleep 10
      
      - name: Run accessibility scan
        run: npx @allylab/cli scan https://your-site.com --fail-on critical
```

#### GitLab CI
```yaml
accessibility:
  image: node:20
  script:
    - npm install -g @allylab/cli
    - allylab scan https://your-site.com --fail-on serious --format json --output a11y-report.json
  artifacts:
    paths:
      - a11y-report.json
```

---

## 📁 Project Structure
```
allylab/
├── packages/
│   ├── api/                 # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── services/    # Scanner, scheduler, AI, GitHub
│   │   │   └── utils/       # Scoring, WCAG helpers
│   │   └── Dockerfile
│   │
│   ├── dashboard/           # React frontend
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── pages/       # Page components
│   │   │   ├── types/       # TypeScript types
│   │   │   └── utils/       # Helpers, storage
│   │   └── Dockerfile
│   │
│   └── cli/                 # Command-line interface
│       ├── src/
│       │   ├── commands/    # scan, site commands
│       │   └── utils/       # API client, output formatting
│       └── package.json
│
├── docs/                    # Documentation
└── package.json             # Monorepo root
```

---

## 🔌 API Reference

### Scan Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/scan` | Start scan (SSE streaming) |
| `POST` | `/scan/json` | Start scan (JSON response) |
| `POST` | `/crawl/scan` | Multi-page site scan (SSE streaming) |

### AI Fixes Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/fixes/generate` | Generate AI-powered fix suggestions |

### GitHub Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/github/connect` | Connect GitHub account |
| `POST` | `/github/disconnect` | Disconnect GitHub account |
| `GET` | `/github/status` | Check connection status |
| `GET` | `/github/repos` | List repositories |
| `GET` | `/github/repos/:owner/:repo/branches` | List branches |
| `POST` | `/github/pr` | Create pull request with fixes |

### Schedule Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/schedules` | List all schedules |
| `POST` | `/schedules` | Create schedule |
| `PATCH` | `/schedules/:id` | Update schedule |
| `DELETE` | `/schedules/:id` | Delete schedule |
| `POST` | `/schedules/:id/run` | Run immediately |

### Webhook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/webhooks` | List all webhooks |
| `POST` | `/webhooks` | Create webhook (Slack/Teams/Generic) |
| `PUT` | `/webhooks/:id` | Update webhook |
| `DELETE` | `/webhooks/:id` | Delete webhook |
| `POST` | `/webhooks/:id/test` | Test webhook |

### JIRA Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/jira/test` | Test connection |
| `POST` | `/jira/create` | Create single issue |
| `POST` | `/jira/bulk` | Create multiple issues |

### Example Request
```bash
# Single page scan
curl -X POST http://localhost:3001/scan/json \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "standard": "wcag21aa",
    "viewport": "desktop"
  }'

# Generate AI fix
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

See [docs/API.md](docs/API.md) for full API documentation.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in `packages/api/`:
```env
# Server
PORT=3001
NODE_ENV=development

# AI Fixes (optional)
ANTHROPIC_API_KEY=your-api-key

# GitHub Integration (optional)
GITHUB_API_URL=https://api.github.com

# JIRA Integration (optional)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
JIRA_MOCK_MODE=true
```

### Dashboard Settings

Configure via Settings page:
- **General**: WCAG standard, warnings, storage limits
- **Scheduled Scans**: Automated monitoring
- **GitHub**: Connect GitHub for PR creation
- **Notifications**: Slack/Teams webhooks
- **JIRA Integration**: Export configuration
- **CI/CD**: Pipeline generator
- **API**: Endpoint configuration

---

## 🐳 Docker

### Quick Start with Docker Compose
```bash
# Clone the repository
git clone https://github.com/yourusername/allylab.git
cd allylab

# Copy environment file
cp .env.example .env

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

**Access:**
- Dashboard: http://localhost:8080
- API: http://localhost:3001

### Build Individual Images
```bash
# Build API
docker build -t allylab-api ./packages/api

# Build Dashboard
docker build -t allylab-dashboard ./packages/dashboard
```

### Run Individual Containers
```bash
# Run API
docker run -d \
  --name allylab-api \
  -p 3001:3001 \
  -e ANTHROPIC_API_KEY=your-key \
  allylab-api

# Run Dashboard
docker run -d \
  --name allylab-dashboard \
  -p 8080:80 \
  allylab-dashboard
```

### Stop and Remove
```bash
# Stop
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## 🧪 Testing
```bash
# Lint
npm run lint

# Type check
npm run typecheck

# Build all packages
npm run build

# Build specific package
npm run build --workspace=@allylab/api
npm run build --workspace=@allylab/dashboard
npm run build --workspace=@allylab/cli
```

---

## 📖 Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [API Reference](docs/API.md)
- [Configuration](docs/CONFIGURATION.md)
- [Deployment](docs/deployment.md)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [axe-core](https://github.com/dequelabs/axe-core) - Accessibility testing engine
- [Playwright](https://playwright.dev/) - Browser automation
- [Fastify](https://fastify.io/) - Web framework
- [React](https://react.dev/) - UI library
- [Claude AI](https://anthropic.com/) - AI-powered fix suggestions

---

<div align="center">
  <p>Built with ❤️ for a more accessible web</p>
</div>