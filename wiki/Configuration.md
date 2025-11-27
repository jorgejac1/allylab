# Configuration

Complete configuration reference for AllyLab.

## Environment Variables

### API Configuration

Create `packages/api/.env`:
```env
# ===========================================
# SERVER
# ===========================================
PORT=3001
NODE_ENV=development

# ===========================================
# AI FIX SUGGESTIONS (Optional)
# ===========================================
# Get key at: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxxxx

# ===========================================
# GITHUB INTEGRATION (Optional)
# ===========================================
# For GitHub Enterprise
GITHUB_API_URL=https://api.github.com

# ===========================================
# JIRA INTEGRATION (Optional)
# ===========================================
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
JIRA_MOCK_MODE=true
```

### Dashboard Configuration

Create `packages/dashboard/.env`:
```env
# API URL
VITE_API_URL=http://localhost:3001
```

---

## Dashboard Settings

Access via **Settings** page.

### General Tab

| Setting | Default | Description |
|---------|---------|-------------|
| Default WCAG Standard | WCAG 2.1 AA | Standard for new scans |
| Include Warnings | Off | Show incomplete checks |
| Auto-save Scans | On | Save results automatically |
| Max Scans Stored | 100 | LocalStorage limit |

### Rules Tab

Manage custom accessibility rules:
- Create new rules
- Enable/disable rules
- Import/export JSON
- Test against sample HTML

### Reports Tab

Configure reporting options:
- Default export format
- Company branding
- Report templates

### Alerts Tab

Configure alert thresholds:
- Score drop alerts
- New critical issue alerts
- Email notifications (coming soon)

### Scheduled Scans Tab

Manage automated scans:
- Add schedules
- Set frequency
- View history

### Notifications Tab

Configure webhooks:
- Slack integration
- Teams integration
- Generic webhooks

### JIRA Tab

JIRA integration settings:
- API endpoint
- Authentication
- Field mapping

### GitHub Tab

GitHub integration:
- Connect/disconnect
- View connected user
- Token management

### CI/CD Tab

Generate pipeline configs:
- Select platform
- Configure options
- Copy/download

### API Tab

API configuration:
- Base URL
- Endpoint reference
- Example requests

---

## LocalStorage Keys

| Key                      | Purpose            |
|--------------------------|--------------------|
| `allylab_scans`          | Saved scan results |
| `allylab_tracked_issues` | Issue fingerprints |
| `allylab_settings`       | User preferences   |
| `allylab_github_token`   | GitHub PAT         |
| `allylab_webhooks`       | Webhook configs    |
| `allylab_jira_config`    | JIRA settings      |
| `allylab_jira_mapping`   | JIRA field maps    |
| `allylab_jira_links`     | Issue links        |
| `allylab_custom_rules`   | Custom rules       |
| `allylab_api_url`        | API base URL       |

---

## WCAG Standards

| Value      | Level | Description          |
|-------     |-------|-------------         |
| `wcag2a`   | A     | WCAG 2.0 minimum     |
| `wcag2aa`  | AA    | WCAG 2.0 standard    |
| `wcag21a`  | A     | WCAG 2.1 minimum     |
| `wcag21aa` | AA    | WCAG 2.1 recommended |
| `wcag22aa` | AA    | WCAG 2.2 latest      |

---

## Viewports

| Value     | Width  | Height | Mobile |
|-------    |------- |--------|--------|
| `desktop` | 1280px | 720px  | No     |
| `tablet`  | 768px  | 1024px | Yes    |
| `mobile`  | 375px  | 667px  | Yes    |

---

## Scoring Algorithm

Score calculation in `packages/api/src/utils/scoring.ts`:
```typescript
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

// Logarithmic scaling
const score = Math.max(0, 100 - Math.log2(totalPenalty + 1) * 15);
```

### Grade Thresholds

| Grade | Score Range |
|-------|-------------|
| A     | 90-100      |
| B     | 80-89       |
| C     | 70-79       |
| D     | 60-69       |
| F     | 0-59        |

---

## Timeouts

| Stage        | Default | Configurable |
|-------       |---------|--------------|
| Navigation   | 60s     | Yes          |
| Render Wait  | 2s      | Yes          |
| Axe Analysis | 30s     | No           |

---

## Rate Limits

Not implemented by default. For production:

| Resource            | Recommended Limit |
|----------           |-------------------|
| Scans/hour          | 100               |
| API requests/minute | 1000              |
| GitHub API          | 5000/hour         |
| JIRA API            | 100/minute        |