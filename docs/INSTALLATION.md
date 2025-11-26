# Installation Guide

This guide covers all installation methods for AllyLab.

## Table of Contents

- [Requirements](#requirements)
- [Quick Install](#quick-install)
- [Manual Installation](#manual-installation)
- [Docker Installation](#docker-installation)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Requirements

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Node.js** | 18.x | 20.x LTS |
| **npm** | 9.x | 10.x |
| **RAM** | 2 GB | 4 GB+ |
| **Disk** | 1 GB | 2 GB+ |

### Browser Requirements (for Playwright)

AllyLab uses Playwright with Chromium for scanning. The browser is installed automatically.

### Optional Requirements

| Service | Purpose |
|---------|---------|
| **Anthropic API Key** | AI-powered fix suggestions |
| **JIRA Account** | Issue export integration |
| **Docker** | Containerized deployment |

---

## Quick Install
```bash
# Clone repository
git clone https://github.com/yourusername/allylab.git
cd allylab

# Install all dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Start development servers
npm run dev
```

**Access:**
- Dashboard: http://localhost:5173
- API: http://localhost:3001

---

## Manual Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/allylab.git
cd allylab
```

### Step 2: Install Root Dependencies
```bash
npm install
```

This installs dependencies for both `packages/api` and `packages/dashboard` via npm workspaces.

### Step 3: Install Playwright Browser
```bash
npx playwright install chromium
```

For all browsers (larger download):
```bash
npx playwright install
```

### Step 4: Configure Environment

Create `packages/api/.env`:
```env
# Required
PORT=3001
NODE_ENV=development

# Optional: AI Fix Suggestions
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional: JIRA Integration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
JIRA_MOCK_MODE=false
```

### Step 5: Build (Optional)

For production builds:
```bash
# Build all packages
npm run build

# Or build individually
npm run build:api
npm run build:dashboard
```

### Step 6: Start Servers

**Development mode (with hot reload):**
```bash
# Both servers
npm run dev

# Or separately
npm run dev:api      # Terminal 1
npm run dev:dashboard # Terminal 2
```

**Production mode:**
```bash
# Build first
npm run build

# Start API
cd packages/api
node dist/index.js

# Serve dashboard (use any static server)
cd packages/dashboard
npx serve dist
```

---

## Docker Installation

### Prerequisites

- Docker 20+
- Docker Compose 2.x (optional)

### Build Images
```bash
# Build API image
docker build -t allylab-api ./packages/api

# Build Dashboard image
docker build -t allylab-dashboard ./packages/dashboard
```

### Run Containers

**API:**
```bash
docker run -d \
  --name allylab-api \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e ANTHROPIC_API_KEY=your-key \
  allylab-api
```

**Dashboard:**
```bash
docker run -d \
  --name allylab-dashboard \
  -p 5173:80 \
  allylab-dashboard
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  api:
    build:
      context: ./packages/api
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - JIRA_BASE_URL=${JIRA_BASE_URL}
      - JIRA_EMAIL=${JIRA_EMAIL}
      - JIRA_API_TOKEN=${JIRA_API_TOKEN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  dashboard:
    build:
      context: ./packages/dashboard
      dockerfile: Dockerfile
    ports:
      - "5173:80"
    depends_on:
      - api
    restart: unless-stopped

networks:
  default:
    name: allylab-network
```

Run:
```bash
docker-compose up -d
```

---

## Production Deployment

### AWS (App Runner)

1. **Push to ECR:**
```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
   
   docker tag allylab-api:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/allylab-api:latest
   docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/allylab-api:latest
```

2. **Create App Runner service** via AWS Console or CLI

3. **Configure environment variables** in App Runner settings

### Heroku
```bash
# Login
heroku login

# Create apps
heroku create allylab-api
heroku create allylab-dashboard

# Set buildpacks
heroku buildpacks:set heroku/nodejs -a allylab-api

# Deploy
git subtree push --prefix packages/api heroku-api main
git subtree push --prefix packages/dashboard heroku-dashboard main
```

### Vercel (Dashboard Only)
```bash
cd packages/dashboard
npx vercel
```

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

---

## Troubleshooting

### Common Issues

#### Playwright Browser Not Found
```
Error: browserType.launch: Executable doesn't exist
```

**Solution:**
```bash
npx playwright install chromium
```

#### Port Already in Use
```
Error: listen EADDRINUSE :::3001
```

**Solution:**
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev:api
```

#### CORS Errors
```
Access to fetch has been blocked by CORS policy
```

**Solution:** Ensure API is running and CORS is configured. Check `packages/api/src/server.ts`:
```typescript
await server.register(cors, {
  origin: true,
  credentials: true,
});
```

#### Timeout During Scan
```
Error: Navigation timeout of 60000 ms exceeded
```

**Solution:** The target site may be slow. The scanner will retry with relaxed settings. For very slow sites, increase timeout in scan options.

#### Memory Issues
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
```

**Solution:** Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

### Getting Help

1. Check [GitHub Issues](https://github.com/yourusername/allylab/issues)
2. Open a new issue with:
   - Node.js version (`node -v`)
   - npm version (`npm -v`)
   - Operating system
   - Full error message
   - Steps to reproduce

---

## Next Steps

- [Configuration Guide](CONFIGURATION.md) - Configure AllyLab settings
- [API Reference](API.md) - Learn the API endpoints
- [Contributing](../CONTRIBUTING.md) - Contribute to AllyLab