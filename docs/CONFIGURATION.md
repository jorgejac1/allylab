# Configuration Guide

Complete reference for configuring AllyLab.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Dashboard Settings](#dashboard-settings)
- [WCAG Standards](#wcag-standards)
- [Viewport Options](#viewport-options)
- [GitHub Integration](#github-integration)
- [Webhooks](#webhooks)
- [JIRA Integration](#jira-integration)
- [Scheduled Scans](#scheduled-scans)
- [CLI Configuration](#cli-configuration)
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
# GITHUB INTEGRATION (Optional)
# ===========================================

# GitHub API URL (for GitHub Enterprise)
GITHUB_API_URL=https://api.github.com

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
| `GITHUB_API_URL` | No | `https://api.github.com` | GitHub API URL |
| `JIRA_BASE_URL` | No | - | JIRA instance URL |
| `JIRA_EMAIL` | No | - | JIRA account email |
| `JIRA_API_TOKEN` | No | - | JIRA API token |
| `JIRA_MOCK_MODE` | No | `true` | Use mock JIRA responses |

### Dashboard Configuration

Create `packages/dashboard/.env`:
```env
# API URL (defaults to http://localhost:3001)
VITE_API_URL=http://localhost:3001
```

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
| `allylab_github_token` | GitHub Personal Access Token |
| `allylab_webhooks` | Webhook configurations |
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

### Usage
```bash
# CLI
allylab scan https://example.com --standard wcag22aa

# API
curl -X POST http://localhost:3001/scan/json \
  -d '{"url": "https://example.com", "standard": "wcag21aa"}'
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

### Usage
```bash
# CLI
allylab scan https://example.com --viewport mobile

# API
curl -X POST http://localhost:3001/scan/json \
  -d '{"url": "https://example.com", "viewport": "mobile"}'
```

---

## GitHub Integration

### Setup

1. Navigate to **Settings → GitHub**
2. Generate a Personal Access Token at https://github.com/settings/tokens
3. Required scopes: `repo` (full control of private repositories)
4. Enter token and click **Connect**

### Features

| Feature | Description |
|---------|-------------|
| **List Repositories** | View repos you have access to |
| **List Branches** | Select target branch for PRs |
| **Create PRs** | Automatically create fix PRs |
| **View Files** | Read file content for fixes |

### Token Permissions

Minimum required scopes:

| Scope | Purpose |
|-------|---------|
| `repo` | Access private repositories |
| `public_repo` | Access public repositories only |

### GitHub Enterprise

For GitHub Enterprise, set the API URL:
```env
GITHUB_API_URL=https://github.your-company.com/api/v3
```

---

## Webhooks

### Setup

1. Navigate to **Settings → Notifications**
2. Click **Add Webhook**
3. Enter webhook URL
4. Type is auto-detected (Slack, Teams, or Generic)

### Supported Platforms

| Platform | URL Pattern | Format |
|----------|-------------|--------|
| **Slack** | `hooks.slack.com` | Block Kit |
| **Microsoft Teams** | `webhook.office.com` | Adaptive Cards |
| **Generic** | Any URL | JSON payload |

### Slack Webhook Setup

1. Go to https://api.slack.com/apps
2. Create new app or select existing
3. Enable **Incoming Webhooks**
4. Add new webhook to workspace
5. Copy webhook URL

### Teams Webhook Setup

1. In Teams, go to channel settings
2. Select **Connectors**
3. Add **Incoming Webhook**
4. Copy webhook URL

### Webhook Payload (Generic)
```json
{
  "event": "scan.complete",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "url": "https://example.com",
    "score": 85,
    "totalIssues": 12,
    "critical": 0,
    "serious": 2,
    "moderate": 6,
    "minor": 4
  }
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

---

## CLI Configuration

### Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `--api-url` | API server URL | `http://localhost:3001` |
| `--format` | Output format | `pretty` |
| `--output` | Write to file | - |

### Configuration File (Future)

Create `allylab.config.json` in project root:
```json
{
  "apiUrl": "http://localhost:3001",
  "defaultStandard": "wcag21aa",
  "defaultViewport": "desktop",
  "failOn": "critical"
}
```

### Environment Variables
```bash
# Set API URL
export ALLYLAB_API_URL=http://localhost:3001

# Run scan
allylab scan https://example.com
```

---

## CI/CD Integration

### Supported Platforms

- **GitHub Actions**
- **GitLab CI**
- **Harness**
- **Jenkins**
- **CircleCI**

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

### GitHub Actions Example
```yaml
name: Accessibility Scan

on:
  push:
    branches: [main]
  pull_request:
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
      
      - name: Run accessibility scan
        run: npx @allylab/cli scan https://example.com --fail-on critical
      
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: accessibility-report
          path: a11y-report.json
```

### GitLab CI Example
```yaml
accessibility:
  image: node:20
  script:
    - npx @allylab/cli scan $CI_ENVIRONMENT_URL --fail-on serious --format json --output a11y-report.json
  artifacts:
    paths:
      - a11y-report.json
    when: always
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

### Framework Detection

For AI fixes, framework is detected from file extension:

| Extension | Framework |
|-----------|-----------|
| `.jsx`, `.tsx` | React |
| `.vue` | Vue |
| `.component.html` | Angular |
| `.html` | HTML |

---

## Next Steps

- [API Reference](API.md) - Complete API documentation
- [Installation](INSTALLATION.md) - Setup guide
- [Contributing](../CONTRIBUTING.md) - Development guide