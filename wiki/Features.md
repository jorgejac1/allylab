# Features

AllyLab provides comprehensive accessibility testing with enterprise-grade features.

## 🔍 Scanning

### Single Page Scanning
- Scan any URL for accessibility issues
- Real-time progress with SSE streaming
- **Authenticated scanning** for protected pages (dashboards, admin panels)

See [[Authenticated Scanning]] for detailed setup.

### Authentication Features
| Feature | Description |
|---------|-------------|
| Multiple auth methods | Cookies, headers, storage state, login flow, basic auth |
| Cookie Capture Extension | Chrome extension for easy cookie export |
| Credential encryption | AES-256-GCM encryption for stored credentials |
| Profile health monitoring | Warnings for expired or untested profiles |
| Domain matching | Wildcard support (e.g., `*.example.com`) |

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

### Git Integration (GitHub & GitLab)

AllyLab supports both GitHub and GitLab for creating fix requests:

| Feature | GitHub | GitLab |
|---------|--------|--------|
| Connection | Personal Access Token | Personal Access Token |
| Self-hosted | GitHub Enterprise | GitLab Self-Managed |
| Fix delivery | Pull Request | Merge Request |
| Batch fixes | ✅ Supported | ✅ Supported |
| Status tracking | ✅ Supported | ✅ Supported |

#### GitHub
- Connect with Personal Access Token (`ghp_*`)
- Automatic branch creation
- Pull request creation
- Batch PR for multiple fixes
- PR status tracking
- Fix verification after merge

#### GitLab
- Connect with Personal Access Token (`glpat-*`)
- Supports GitLab.com and self-hosted instances
- Automatic branch creation
- Merge request creation
- Batch MR for multiple fixes
- MR status tracking
- Pipeline status integration

### Fix Workflow
1. Select finding with issue
2. Click "Generate AI Fix"
3. Review suggested code
4. Click "Create PR" (GitHub) or "Create MR" (GitLab)
5. Select repository/project and branch
6. PR/MR created automatically

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
- Azure Pipelines

### Features
- Fail on severity threshold
- Fail on score threshold
- Artifact upload
- JSON reports

See [[CI/CD Integration]] for setup guides.

---

## 💻 Command Line Interface (CLI)

The `@allylab/cli` package provides powerful command-line access to AllyLab scanning.

### Installation

```bash
npm install -g @allylab/cli
```

### Commands

| Command | Description |
|---------|-------------|
| `allylab scan <url>` | Scan single page |
| `allylab site <url>` | Crawl and scan multiple pages |
| `allylab batch <file>` | Scan URLs from file |
| `allylab watch <url>` | Continuous monitoring |
| `allylab init <template>` | Generate CI config |
| `allylab info` | Show CLI info |

### Output Formats

| Format | Use Case |
|--------|----------|
| `pretty` | Human-readable terminal output |
| `json` | Machine processing |
| `sarif` | GitHub Code Scanning |
| `html` | Shareable reports |
| `summary` | Compact single-line |

### Configuration

Settings can be configured via:

1. **CLI flags:** `--standard wcag22aa`
2. **Environment variables:** `ALLYLAB_STANDARD=wcag22aa`
3. **Config files:** `.allylabrc.json`

Priority: CLI > Environment > Config > Defaults

### CI Config Generation

```bash
# Generate GitHub Actions workflow with SARIF
allylab init github-actions

# Generate GitLab CI config
allylab init gitlab-ci

# Generate config file
allylab init config
```

### Example Usage

```bash
# Basic scan
allylab scan https://example.com

# CI/CD with failure threshold
allylab scan https://example.com --fail-on serious --format sarif -o results.sarif

# Batch scan from file
allylab batch urls.txt --format json -o batch-results.json

# Watch mode for development
allylab watch http://localhost:3000 --interval 30
```

See the [CLI README](../packages/cli/README.md) for full documentation.

---

## 📋 JIRA Integration

- Export issues to JIRA
- Custom field mapping
- Bulk issue creation
- Link findings to issues

See [[Integrations]] for setup.

---

## 🧪 Development & Testing

### Test Coverage

AllyLab maintains comprehensive test coverage:

| Type | Coverage | Tests |
|------|----------|-------|
| Unit Tests | ~95% | 2180+ |
| E2E Tests | Major workflows | 60 |

### Unit Tests

- **Technology:** Vitest, React Testing Library
- **Coverage:** ~95% statement, ~92% branch
- **Location:** `packages/dashboard/src/__tests__/`

### E2E Tests

- **Technology:** Playwright
- **Workflows Covered:**
  - Scan workflow (URL input, options, execution)
  - Findings workflow (history, filtering, details)
  - Executive dashboard (KPIs, trends, drill-down)
  - Benchmark page (competitors, comparison)
  - Settings page (all 10 tabs)
- **Location:** `packages/dashboard/e2e/`

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npx playwright test --project=chromium

# Coverage report
npm run test:coverage
```

---

## 📈 Performance Analysis

### Lighthouse Scores (January 2026)

| Category | Score |
|----------|-------|
| Performance | 85/100 |
| Accessibility | 89/100 |
| Best Practices | 96/100 |

### Core Web Vitals

| Metric | Value | Status |
|--------|-------|--------|
| FCP (First Contentful Paint) | 2.9s | ⚠️ Needs improvement |
| LCP (Largest Contentful Paint) | 3.6s | ⚠️ Needs improvement |
| TBT (Total Blocking Time) | 0ms | ✅ Good |
| CLS (Cumulative Layout Shift) | 0 | ✅ Good |
| Speed Index | 2.9s | ⚠️ Needs improvement |

### Issues Found & Recommendations

#### 1. Large Bundle Sizes

| Bundle | Size | Gzipped |
|--------|------|---------|
| vendor-excel | 938 KB | 269 KB |
| vendor-pdf | 588 KB | 172 KB |
| ReportsPage | 412 KB | 119 KB |

**Recommendation:** Lazy load Excel and PDF libraries only when user exports.

#### 2. Unused JavaScript (~1.5s potential savings)

| File | Wasted | Total |
|------|--------|-------|
| vendor-pdf | 125 KB | 168 KB |
| ScanResults | 37 KB | 39 KB |
| index | 23 KB | 62 KB |

**Recommendation:** Code-split and dynamic import heavy libraries.

#### 3. Color Contrast Issues (Accessibility)

Sidebar text has insufficient contrast ratio:
- `#64748b` on `#0f172a` = 3.75:1 (needs 4.5:1)
- `#475569` on `#0f172a` = 2.35:1 (needs 4.5:1)

**Affected:** Section headers (SCANNING, ANALYSIS, CONFIGURATION), version text

**Recommendation:** Use lighter gray like `#94a3b8` for better contrast.

#### 4. Missing Label on Select (Accessibility)

The WCAG standard `<select>` on the scan page has no associated label.

**Recommendation:** Add `aria-label="WCAG Standard"` to the select element.

### Quick Wins

| Fix | Impact | Effort | Status |
|-----|--------|--------|--------|
| Fix sidebar color contrast | +5 accessibility score | Low | ✅ Done |
| Add aria-label to select | +2 accessibility score | Low | ✅ Done |
| Lazy load PDF/Excel | -1.5MB initial bundle, +10 performance | Medium | ✅ Done |

### Optimizations Applied

| Optimization | Before | After | Savings |
|--------------|--------|-------|---------|
| Code-split ReportsPage | 412 KB entry | 0.85 KB entry | 99.8% |
| Lazy load TrendCharts | In main bundle | 25 KB chunk | Loaded on demand |
| Separate vendor-charts | In TrendCharts | 356 KB chunk | Tree-shakeable |
| Separate vendor-pdf | In ReportsPage | 386 KB chunk | Loaded on export |
| Separate vendor-excel | In ReportsPage | 938 KB chunk | Loaded on export |
| Removed unused html2canvas | Direct dependency | Transitive only | Cleaner deps |
| Module preload | Disabled | Enabled | Faster chunk loading |
| Loading state | None | Instant feedback | Better perceived perf |
| DNS prefetch | None | API prefetched | Faster API calls |
| Critical CSS inlined | External | Inline in HTML | -0.3s FCP |
| Pre-rendered static shell | None | Full sidebar shell | -0.5s LCP |
| Smart modulepreload | All chunks | Critical only | Skip lazy chunks |
| Preconnect API | None | localhost:3001 | Faster connections |
| Build target es2020 | es2015 | es2020 | Smaller bundles |
| Separate vendor-icons | In main bundle | 21 KB chunk | Loaded on demand |

---

## 🔐 API Security & Improvements Roadmap

The AllyLab API requires hardening before production deployment. Below is the prioritized improvement plan.

### Current API Status

| Category | Rating | Notes |
|----------|--------|-------|
| Architecture | 8/10 | Clean separation, good TypeScript typing |
| **Security** | **7/10** | JWT auth, SSRF protection, rate limiting, encrypted tokens |
| **Performance** | **8/10** | Browser pool (10 pages), async storage, caching, timeouts |
| **Observability** | **8/10** | Prometheus metrics, request tracing, structured logging |
| **Reliability** | **8/10** | Webhook retry, graceful shutdown, pagination, DB migration path |
| Scalability | 5/10 | Storage interface ready for DB migration |
| Testing | 9/10 | 700+ unit tests, good API coverage |

### Week 1: Security (Critical) ✅ COMPLETE

| Task | Priority | Status | Description |
|------|----------|--------|-------------|
| JWT Authentication | CRITICAL | ✅ Done | Bearer token validation middleware (`src/middleware/auth.ts`) |
| SSRF Protection | CRITICAL | ✅ Done | Block private IPs, localhost, internal domains (`src/utils/url-validator.ts`) |
| Input Validation | HIGH | ✅ Done | Zod schemas for all endpoints (`src/schemas/index.ts`) |
| Rate Limiting | HIGH | ✅ Done | @fastify/rate-limit in `server.ts` with per-endpoint config |
| Token Encryption | HIGH | ✅ Done | AES-256-GCM encrypted storage (`src/utils/crypto.ts`) |

### Week 2: Performance (High) ✅ COMPLETE

| Task | Priority | Status | Description |
|------|----------|--------|-------------|
| Browser Page Pool | HIGH | ✅ Done | 10 concurrent pages with pool management (`src/services/browser.ts`) |
| Async Storage | HIGH | ✅ Done | Non-blocking file I/O with write debouncing (`src/utils/storage.ts`) |
| Request Timeouts | HIGH | ✅ Done | Configurable navigation/total scan timeouts in `config/env.ts` |
| Structured Logging | HIGH | ✅ Done | Pino logger with service-specific loggers (`src/utils/logger.ts`) |
| GitHub API Caching | MEDIUM | ✅ Done | 5-minute TTL for user, repos, branches, trees (`src/services/github.ts`) |

### Week 3: Observability (Medium) ✅ COMPLETE

| Task | Priority | Status | Description |
|------|----------|--------|-------------|
| Health Check Details | MEDIUM | ✅ Done | Browser pool, memory, uptime, cache stats (`src/routes/health.ts`) |
| Prometheus Metrics | MEDIUM | ✅ Done | Request count, latency, errors, scan metrics (`src/utils/metrics.ts`) |
| OpenAPI Spec | MEDIUM | ✅ Done | @fastify/swagger with UI at /docs (`src/config/swagger.ts`) |
| Request Correlation | MEDIUM | ✅ Done | X-Request-ID headers, trace IDs in logs (`src/server.ts`) |
| Error Standardization | MEDIUM | ✅ Done | ApiError class with standard codes (`src/utils/errors.ts`) |

### Week 4: Reliability (Medium) ✅ COMPLETE

| Task | Priority | Status | Description |
|------|----------|--------|-------------|
| Webhook Retry Logic | MEDIUM | ✅ Done | Exponential backoff with jitter, max 5 retries (`src/services/webhooks.ts`) |
| Trend Optimization | MEDIUM | ✅ Done | Single-pass calculations for 8x performance (`src/routes/trends.ts`) |
| Pagination | MEDIUM | ✅ Done | Limit/offset for list endpoints (`src/utils/pagination.ts`) |
| Graceful Shutdown | MEDIUM | ✅ Done | Connection draining, browser cleanup, scheduler stop (`src/server.ts`) |
| Database Migration | LOW | ✅ Done | IStorage interface for SQLite/PostgreSQL (`src/interfaces/storage.ts`) |

### Security Vulnerabilities Identified

#### 1. No Authentication (CRITICAL)
All 52 endpoints are publicly accessible. Anyone can:
- Create webhooks to exfiltrate data
- Connect GitHub accounts
- Schedule scans (resource exhaustion)
- Modify custom rules

#### 2. SSRF Risk (CRITICAL)
URLs not validated before scanning:
```javascript
// Current: No validation
const { url } = request.body;
await runScan({ url }); // Can scan localhost:8000, 192.168.x.x
```

#### 3. Weak Token Storage (HIGH)
GitHub/Jira tokens stored in-memory, plain text:
```javascript
const githubTokens = new Map<string, string>(); // Lost on restart
```

#### 4. No Input Validation (HIGH)
CSS selectors, regex patterns not validated:
```javascript
// User can inject: "; alert('xss'); //"
const { selector } = request.body;
await page.$$(selector); // Direct execution
```

### Implementation Files

| Feature | Files to Create/Modify |
|---------|----------------------|
| Authentication | `src/middleware/auth.ts`, `src/routes/*.ts` |
| SSRF Protection | `src/utils/url-validator.ts`, `src/routes/scan.ts` |
| Input Validation | `src/schemas/*.ts`, all routes |
| Rate Limiting | `src/server.ts` |
| Token Encryption | `src/utils/crypto.ts`, `src/services/github.ts` |

### Dependencies to Add

```bash
# Week 1: Security
npm install zod @fastify/rate-limit jsonwebtoken

# Week 2: Performance
npm install pino pino-pretty

# Week 3: Observability
npm install @fastify/swagger @fastify/swagger-ui prom-client
```