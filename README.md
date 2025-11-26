<div align="center">
  <h1>🔬 AllyLab</h1>
  <p><strong>Enterprise-grade web accessibility scanner with AI-powered fix suggestions</strong></p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#documentation">Documentation</a> •
    <a href="#api">API</a> •
    <a href="#contributing">Contributing</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/WCAG-2.1%20AA-green" alt="WCAG 2.1 AA">
    <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License">
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue" alt="TypeScript">
    <img src="https://img.shields.io/badge/React-18-blue" alt="React 18">
  </p>
</div>

---

## ✨ Features

### 🔍 Comprehensive Scanning
- **WCAG 2.0, 2.1, 2.2** compliance testing (A, AA levels)
- **Multi-viewport** testing (Desktop, Tablet, Mobile)
- **Real-time streaming** results via Server-Sent Events
- Powered by [axe-core](https://github.com/dequelabs/axe-core) and [Playwright](https://playwright.dev/)

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
- Issue patterns analysis

### 📅 Scheduled Scans
- Automated recurring scans (hourly, daily, weekly, monthly)
- Score history and trend tracking
- Run scans on-demand

### 🔗 JIRA Integration
- Export issues directly to JIRA
- Custom field mapping (severity → priority)
- Bulk issue creation (up to 1000 at once)
- Link findings to existing JIRA issues

### 🔧 CI/CD Integration
- Generate pipeline configs for **GitHub Actions**, **GitLab CI**, **Harness**
- Fail builds on critical/serious issues
- Configurable score thresholds

### 🤖 AI-Powered Fixes
- Contextual fix suggestions using Claude AI
- Code snippets for common issues
- Remediation guidance

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

## 📁 Project Structure
```
allylab/
├── packages/
│   ├── api/                 # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── services/    # Scanner, scheduler, AI
│   │   │   └── utils/       # Scoring, WCAG helpers
│   │   └── Dockerfile
│   │
│   └── dashboard/           # React frontend
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── hooks/       # Custom React hooks
│       │   ├── pages/       # Page components
│       │   ├── types/       # TypeScript types
│       │   └── utils/       # Helpers, storage
│       └── Dockerfile
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

### Schedule Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/schedules` | List all schedules |
| `POST` | `/schedules` | Create schedule |
| `PATCH` | `/schedules/:id` | Update schedule |
| `DELETE` | `/schedules/:id` | Delete schedule |
| `POST` | `/schedules/:id/run` | Run immediately |

### JIRA Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/jira/test` | Test connection |
| `POST` | `/jira/create` | Create single issue |
| `POST` | `/jira/bulk` | Create multiple issues |

### Example Request
```bash
curl -X POST http://localhost:3001/scan/json \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "standard": "wcag21aa",
    "viewport": "desktop"
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

# Build
npm run build
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

---

<div align="center">
  <p>Built with ❤️ for a more accessible web</p>
</div>