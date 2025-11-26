# Configuration Guide

Complete reference for configuring AllyLab.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Dashboard Settings](#dashboard-settings)
- [WCAG Standards](#wcag-standards)
- [Viewport Options](#viewport-options)
- [JIRA Integration](#jira-integration)
- [Scheduled Scans](#scheduled-scans)
- [CI/CD Integration](#cicd-integration)

---

## Environment Variables

### API Configuration

Create `packages/api/.env`:
```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================

# Port for the API server
PORT=3001

# Environment: development | production
NODE_ENV=development

# ===========================================
# AI FIX SUGGESTIONS (Optional)
# ===========================================

# Anthropic API key for Claude-powered fix suggestions
# Get yours at: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxxxx

# ===========================================
# JIRA INTEGRATION (Optional)
# ===========================================

# Your Atlassian domain
JIRA_BASE_URL=https://your-domain.atlassian.net

# Email associated with your Atlassian account
JIRA_EMAIL=your-email@example.com

# API token from: https://id.atlassian.com/manage-profile/security/api-tokens
JIRA_API_TOKEN=your-api-token

# Enable mock mode for testing (true | false)
JIRA_MOCK_MODE=true
```

### Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | API server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `ANTHROPIC_API_KEY` | No | - | Enable AI fix suggestions |
| `JIRA_BASE_URL` | No | - | JIRA instance URL |
| `JIRA_EMAIL` | No | - | JIRA account email |
| `JIRA_API_TOKEN` | No | - | JIRA API token |
| `JIRA_MOCK_MODE` | No | `true` | Use mock JIRA responses |

---

## Dashboard Settings

Access via **Settings** page in the dashboard.

### General Settings

| Setting | Default | Description |
|---------|---------|-------------|
| **Default WCAG Standard** | WCAG 2.1 AA | Standard used for new scans |
| **Include Warnings** | Off | Show potential issues needing manual review |
| **Auto-save Scans** | On | Automatically save scan results |
| **Max Scans Stored** | 100 | Maximum scans in local storage |

### Storage

Scan data is stored in browser localStorage:

| Key | Purpose |
|-----|---------|
| `allylab_scans` | Saved scan results |
| `allylab_tracked_issues` | Issue fingerprints and status |
| `allylab_settings` | User preferences |
| `allylab_jira_config` | JIRA configuration |
| `allylab_jira_mapping` | JIRA field mappings |
| `allylab_jira_links` | Finding-to-JIRA issue links |

**Clear All Data:** Settings → General → Danger Zone → Clear All Data

---

## WCAG Standards

### Available Standards

| Standard | Level | Description |
|----------|-------|-------------|
| `wcag2a` | A | WCAG 2.0 Level A (minimum) |
| `wcag2aa` | AA | WCAG 2.0 Level AA |
| `wcag21a` | A | WCAG 2.1 Level A |
| `wcag21aa` | AA | WCAG 2.1 Level AA (recommended) |
| `wcag22aa` | AA | WCAG 2.2 Level AA (latest) |

### Recommendation

**WCAG 2.1 AA** is recommended as it:
- Covers most legal requirements (ADA, Section 508, EN 301 549)
- Includes mobile accessibility criteria
- Has broad industry adoption

### Scan Request Example
```json
{
  "url": "https://example.com",
  "standard": "wcag21aa"
}
```

---

## Viewport Options

### Available Viewports

| Viewport | Width | Height | Mobile | Touch |
|----------|-------|--------|--------|-------|
| `desktop` | 1280px | 720px | No | No |
| `tablet` | 768px | 1024px | Yes | Yes |
| `mobile` | 375px | 667px | Yes | Yes |

### Configuration
```typescript
const VIEWPORT_CONFIGS = {
  desktop: { width: 1280, height: 720, isMobile: false, hasTouch: false },
  tablet: { width: 768, height: 1024, isMobile: true, hasTouch: true },
  mobile: { width: 375, height: 667, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};
```

### Scan Request Example
```json
{
  "url": "https://example.com",
  "viewport": "mobile"
}
```

---

## JIRA Integration

### Setup

1. Navigate to **Settings → JIRA Integration**
2. Enable JIRA Integration
3. Configure endpoint and credentials
4. Test connection

### Configuration Options

| Field | Description | Example |
|-------|-------------|---------|
| **API Endpoint** | JIRA REST API URL | `http://localhost:3001/jira/create` |
| **Authorization Header** | Auth token (optional) | `Basic xxxx` or `Bearer xxxx` |
| **Project Key** | JIRA project key | `A11Y` |
| **Issue Type** | Default issue type | `Bug`, `Task`, `Story` |

### Field Mapping

Map AllyLab fields to JIRA fields:

| AllyLab Field | JIRA Field | Values |
|---------------|------------|--------|
| Severity: Critical | Priority | Highest |
| Severity: Serious | Priority | High |
| Severity: Moderate | Priority | Medium |
| Severity: Minor | Priority | Low |
| WCAG Tags | Labels | `wcag-2.1.1`, `wcag-1.4.3` |
| Rule ID | Labels | `color-contrast`, `image-alt` |

### Mock Mode

For testing without a real JIRA instance:
- Use endpoint: `http://localhost:3001/jira/create`
- Issues are stored in memory
- Returns mock issue keys: `MOCK-1`, `MOCK-2`, etc.

---

## Scheduled Scans

### Setup

1. Navigate to **Settings → Scheduled Scans**
2. Enter URL to monitor
3. Select frequency
4. Click **Add Schedule**

### Frequency Options

| Frequency | Interval | Use Case |
|-----------|----------|----------|
| **Hourly** | Every hour | Critical production sites |
| **Daily** | Every 24 hours | Standard monitoring |
| **Weekly** | Every 7 days | Low-priority sites |
| **Monthly** | Every 30 days | Periodic audits |

### Schedule Management

| Action | Description |
|--------|-------------|
| **Enable/Disable** | Toggle monitoring on/off |
| **Run Now** | Trigger immediate scan |
| **View History** | See past scan results |
| **Delete** | Remove schedule |

### API Endpoints
```bash
# List schedules
GET /schedules

# Create schedule
POST /schedules
{
  "url": "https://example.com",
  "frequency": "daily"
}

# Update schedule
PATCH /schedules/:id
{
  "enabled": false
}

# Run immediately
POST /schedules/:id/run

# Get history
GET /schedules/:id/history
```

---

## CI/CD Integration

### Supported Platforms

- **GitHub Actions**
- **GitLab CI**
- **Harness**

### Configuration Options

| Option | Description |
|--------|-------------|
| **Platform** | CI/CD platform to generate config for |
| **Schedule** | On Push, Daily, Weekly, Manual Only |
| **URLs** | List of URLs to scan |
| **Min Score Threshold** | Fail if score below threshold (0-100) |
| **Fail on Critical** | Fail build on critical issues |
| **Fail on Serious** | Fail build on serious issues |
| **Upload Artifacts** | Save scan results as artifacts |

### Generated Workflow (GitHub Actions)
```yaml
name: Accessibility Scan

on:
  push:
    branches: [main]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install chromium
      
      - name: Run accessibility scan
        run: |
          npx @axe-core/cli https://example.com --exit
```

### Using in Your Pipeline

1. Navigate to **Settings → CI/CD Integration**
2. Configure options
3. Click **Copy** or **Download**
4. Add to your repository:
   - GitHub: `.github/workflows/accessibility.yml`
   - GitLab: `.gitlab-ci.yml`
   - Harness: `harness-pipeline.yaml`

---

## Advanced Configuration

### Custom Scoring Algorithm

Scoring is calculated in `packages/api/src/utils/scoring.ts`:
```typescript
export function calculateScore(severity: SeverityCounts): number {
  const weights = {
    critical: 25,
    serious: 10,
    moderate: 3,
    minor: 1,
  };
  
  const totalPenalty = 
    severity.critical * weights.critical +
    severity.serious * weights.serious +
    severity.moderate * weights.moderate +
    severity.minor * weights.minor;
  
  // Logarithmic scaling for realistic scores
  const score = Math.max(0, 100 - Math.log2(totalPenalty + 1) * 15);
  return Math.round(score);
}
```

### Timeout Configuration

Default timeouts in scanning:

| Stage | Timeout | Configurable |
|-------|---------|--------------|
| Navigation | 60s | In scanner.ts |
| Render wait | 2s | In scanner.ts |
| Axe analysis | 30s | axe-core default |

---

## Next Steps

- [API Reference](API.md) - Complete API documentation
- [Installation](INSTALLATION.md) - Setup guide
- [Contributing](../CONTRIBUTING.md) - Development guide