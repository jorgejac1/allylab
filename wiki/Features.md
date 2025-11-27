# Features

AllyLab provides comprehensive accessibility testing with enterprise-grade features.

## 🔍 Scanning

### Single Page Scanning
- Scan any URL for accessibility issues
- Real-time progress with SSE streaming
- Support for authenticated pages (coming soon)

### Multi-Page Site Scanning
- Automatic crawling and discovery
- Configurable max pages and depth
- Aggregate statistics across all pages

### WCAG Standards
| Standard | Description |
|----------|-------------|
| WCAG 2.0 A | Minimum conformance |
| WCAG 2.0 AA | Standard conformance |
| WCAG 2.1 A | Including mobile criteria |
| WCAG 2.1 AA | Recommended standard |
| WCAG 2.2 AA | Latest standard |

### Viewport Testing
| Viewport | Dimensions | Device |
|----------|------------|--------|
| Desktop | 1280×720 | Standard monitor |
| Tablet | 768×1024 | iPad-like |
| Mobile | 375×667 | iPhone-like |

---

## 🤖 AI-Powered Fixes

### Fix Generation
- Contextual suggestions using Claude AI
- Framework-specific code (HTML, React, Vue, Angular)
- Confidence levels (High, Medium, Low)
- Effort estimates (Low, Medium, High)

### GitHub Integration
- Connect with Personal Access Token
- Automatic branch creation
- Pull request creation
- Batch PR for multiple fixes
- PR status tracking
- Fix verification after merge

### Fix Workflow
1. Select finding with issue
2. Click "Generate AI Fix"
3. Review suggested code
4. Click "Create PR"
5. Select repository and branch
6. PR created automatically

---

## 📊 Analytics & Reporting

### Executive Dashboard
- KPI cards with trends
- Score distribution charts
- Top issues by frequency
- Site rankings with grades

### Historical Trends
- Score trends over time
- Issue trends by severity
- Period comparison
- Projected improvement

### Exports
| Format | Use Case |
|--------|----------|
| PDF | Stakeholder reports |
| CSV | Spreadsheet analysis |
| JSON | Data integration |
| Excel | Detailed analysis |

---

## 📏 Custom Rules

Create custom accessibility checks beyond axe-core:

### Rule Types
| Type | Description |
|------|-------------|
| Selector | Check if CSS selector exists |
| Attribute | Check element attributes |
| Content | Check text content |
| Structure | Check DOM structure |

### Features
- Visual rule builder
- Test against sample HTML
- Import/export as JSON
- Enable/disable per rule
- WCAG tag mapping

See [[Custom Rules]] for detailed guide.

---

## 🔄 Issue Tracking

### Automatic Fingerprinting
Each issue gets a unique fingerprint based on:
- Rule ID
- Element selector
- URL pattern
- Issue hash

### Status Tracking
| Status | Meaning |
|--------|---------|
| New | First occurrence |
| Recurring | Seen in previous scans |
| Fixed | No longer present |

### False Positive Management
- Mark issues as false positives
- Persist across scans
- Export/import configurations

---

## 📅 Scheduled Scans

### Frequencies
| Schedule | Interval |
|----------|----------|
| Hourly | Every hour |
| Daily | Every 24 hours |
| Weekly | Every 7 days |
| Monthly | Every 30 days |

### Features
- Score history tracking
- Trend analysis
- Run on-demand
- Webhook notifications

---

## 🔔 Notifications

### Supported Platforms
| Platform | Format |
|----------|--------|
| Slack | Block Kit messages |
| Microsoft Teams | Adaptive Cards |
| Generic | JSON payload |

### Events
- Scan complete
- Score threshold alerts
- New critical issues
- Scheduled scan results

---

## 🏆 Competitor Benchmarking

- Add competitor URLs
- Compare accessibility scores
- Track relative position
- Side-by-side analysis

---

## 🔧 CI/CD Integration

### Supported Platforms
- GitHub Actions
- GitLab CI
- Harness
- Jenkins
- CircleCI

### Features
- Fail on severity threshold
- Fail on score threshold
- Artifact upload
- JSON reports

See [[CI/CD Integration]] for setup guides.

---

## 📋 JIRA Integration

- Export issues to JIRA
- Custom field mapping
- Bulk issue creation
- Link findings to issues

See [[Integrations]] for setup.