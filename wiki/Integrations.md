# Integrations

Connect AllyLab with your existing tools and workflows.

## GitHub Integration

### Overview

GitHub integration enables:
- Automatic PR creation with fixes
- Batch PR for multiple issues
- PR status tracking
- Fix verification after merge

### Setup

1. Navigate to **Settings** → **GitHub**
2. Generate a [Personal Access Token](https://github.com/settings/tokens)
   - Required scope: `repo` (full repository access)
3. Enter token in AllyLab
4. Click **Connect**

### Creating PRs

#### Single Fix PR
1. View finding details
2. Click **Generate AI Fix**
3. Review suggested code
4. Click **Create PR**
5. Select repository and branch
6. PR created automatically

#### Batch PR (Multiple Fixes)
1. Select multiple findings
2. Click **Create Batch PR**
3. Map file paths for each fix
4. Generate all fixes
5. Single PR with all changes

### PR Workflow
```
Finding → Generate Fix → Review → Create PR → Merge → Verify
```

### Verification

After PR merge:
1. Click **Verify Fixes**
2. AllyLab re-scans the page
3. Checks if issues are resolved
4. Updates finding status

### GitHub Enterprise

For GitHub Enterprise, set environment variable:
```env
GITHUB_API_URL=https://github.your-company.com/api/v3
```

---

## GitLab Integration

### Overview

GitLab integration enables:
- Automatic MR (Merge Request) creation with fixes
- Batch MR for multiple issues
- MR status tracking
- Fix verification after merge
- Support for GitLab.com and self-hosted instances

### Setup

1. Navigate to **Settings** → **Git**
2. Click on the **GitLab** provider card
3. Generate a [Personal Access Token](https://gitlab.com/-/user_settings/personal_access_tokens)
   - Required scope: `api` (Full API access)
   - Or minimum: `read_repository`, `write_repository`
4. (Optional) Check "Self-hosted GitLab" for on-premise instances
5. Enter token in AllyLab
6. Click **Connect**

### Token Formats

GitLab supports multiple token formats:
- **Personal Access Tokens:** `glpat-xxxxxxxxxxxxxxxxxxxx`
- **Legacy Tokens:** 20+ character alphanumeric string

### Creating Merge Requests

#### Single Fix MR
1. View finding details
2. Click **Generate AI Fix**
3. Review suggested code
4. Click **Create MR**
5. Select project and branch
6. MR created automatically

#### Batch MR (Multiple Fixes)
1. Select multiple findings
2. Click **Create Batch MR**
3. Map file paths for each fix
4. Generate all fixes
5. Single MR with all changes

### MR Workflow
```
Finding → Generate Fix → Review → Create MR → Merge → Verify
```

### Verification

After MR merge:
1. Click **Verify Fixes**
2. AllyLab re-scans the page
3. Checks if issues are resolved
4. Updates finding status

### Self-Hosted GitLab

For on-premise GitLab installations:
1. Click "Self-hosted GitLab" checkbox
2. Enter your instance URL (e.g., `https://gitlab.yourcompany.com`)
3. Enter your Personal Access Token
4. Click **Connect**

### GitLab vs GitHub Comparison

| Feature | GitHub | GitLab |
|---------|--------|--------|
| Fix creation | Pull Request | Merge Request |
| Token type | `ghp_*` PAT | `glpat-*` PAT |
| Self-hosted | Enterprise Server | Self-managed |
| Pipeline status | GitHub Actions | GitLab CI |

---

## JIRA Integration

### Overview

JIRA integration enables:
- Export findings as JIRA issues
- Custom field mapping
- Bulk issue creation
- Link findings to issues

### Setup

1. Navigate to **Settings** → **JIRA**
2. Enable JIRA Integration
3. Configure:
   - API Endpoint
   - Authorization Header (optional)
   - Project Key
   - Issue Type

### Field Mapping

Map AllyLab severities to JIRA priorities:

| AllyLab Severity | JIRA Priority |
|------------------|---------------|
| Critical | Highest |
| Serious | High |
| Moderate | Medium |
| Minor | Low |

### Creating Issues

#### Single Issue
1. View finding details
2. Click **Export to JIRA**
3. Review mapped fields
4. Click **Create Issue**

#### Bulk Export
1. Select multiple findings
2. Click **Export to JIRA**
3. Review all issues
4. Click **Create All**

### Issue Format
```
Summary: [A11Y] {Rule Title} - {SEVERITY}
Description:
  *Issue:* {Description}
  *Element:* {HTML snippet}
  *Selector:* {CSS selector}
  *Page:* {URL}
  *WCAG:* {WCAG tags}
Labels: wcag-{criterion}, {rule-id}
```

### Mock Mode

For testing without real JIRA:
```env
JIRA_MOCK_MODE=true
```

---

## Slack Integration

### Overview

Receive scan notifications in Slack:
- Scan completion alerts
- Score summaries
- Severity breakdown
- Direct links to findings

### Setup

1. Create [Slack Incoming Webhook](https://api.slack.com/messaging/webhooks)
2. Navigate to **Settings** → **Notifications**
3. Click **Add Webhook**
4. Paste Slack webhook URL
5. Auto-detected as Slack

### Message Format
```
🔬 AllyLab Scan Complete

📊 Score: 85/100 (B)
🔗 https://example.com

Issues Found:
🔴 Critical: 0
🟠 Serious: 2
🟡 Moderate: 6
🔵 Minor: 4

[View Full Report]
```

### Testing

Click **Test** to send a sample notification.

---

## Microsoft Teams Integration

### Overview

Receive scan notifications in Teams:
- Adaptive Card format
- Rich formatting
- Action buttons

### Setup

1. Create [Teams Incoming Webhook](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)
2. Navigate to **Settings** → **Notifications**
3. Click **Add Webhook**
4. Paste Teams webhook URL
5. Auto-detected as Teams

### Message Format

Teams notifications use Adaptive Cards with:
- Score badge
- Severity indicators
- Issue counts
- Link to report

---

## Generic Webhooks

### Overview

Send scan results to any HTTP endpoint.

### Setup

1. Navigate to **Settings** → **Notifications**
2. Click **Add Webhook**
3. Enter your endpoint URL
4. Type: Generic

### Payload Format
```json
{
  "event": "scan.complete",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "id": "scan_123",
    "url": "https://example.com",
    "score": 85,
    "grade": "B",
    "totalIssues": 12,
    "critical": 0,
    "serious": 2,
    "moderate": 6,
    "minor": 4,
    "scanDuration": 4823,
    "viewport": "desktop",
    "standard": "wcag21aa"
  }
}
```

### Events

| Event               | Trigger                 |
|---------------------|-------------------------|
| `scan.complete`     | Scan finished           |
| `scan.failed`       | Scan error              | 
| `schedule.complete` | Scheduled scan finished |

---

## Integration Status

View all integrations in **Settings**:

| Integration | Status       | Actions    |
|-------------|--------------|------------|
| GitHub      | Connected ✅ | Disconnect |
| GitLab      | Connected ✅ | Disconnect |
| JIRA        | Mock Mode 🔶 | Configure  |
| Slack       | 2 webhooks   | Manage     |
| Teams       | 1 webhook    | Manage     |

> **Note:** Both GitHub and GitLab can be connected simultaneously. You can choose which provider to use when creating fix requests.