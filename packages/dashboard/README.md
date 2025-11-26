# @allylab/dashboard

React-based web dashboard for AllyLab accessibility scanning. Built with React 19, Vite, and TypeScript.

## Features

- 🔍 **Single Page Scanner** - Scan any URL with real-time progress
- 🌐 **Multi-Page Site Scanner** - Crawl and scan entire websites
- 📊 **Executive Dashboard** - High-level overview with KPIs and trends
- 🏆 **Competitor Benchmarking** - Compare accessibility across sites
- 📈 **Reports & History** - Track scans over time with trend analysis
- 🤖 **AI-Powered Fixes** - View and apply fix suggestions
- 🔗 **GitHub Integration** - Create PRs directly from findings
- 📅 **Scheduled Scans** - Set up recurring scans
- 🔔 **Webhooks** - Configure Slack/Teams notifications
- 📋 **JIRA Integration** - Export issues to JIRA
- 📄 **PDF Export** - Generate stakeholder reports

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- AllyLab API running on port 3001

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

## Pages

### Accessibility Scanner (`/scan`)

Single page scanning with:
- URL input with WCAG standard selection
- Real-time scan progress via SSE
- Results with severity breakdown
- Finding details with code snippets
- AI fix suggestions
- Export options (CSV, JSON, PDF)

### Site Scanner (`/site-scan`)

Multi-page website scanning:
- Configurable max pages and crawl depth
- Real-time crawl progress
- Page-by-page results
- Aggregate statistics

### Executive Dashboard (`/executive`)

High-level overview:
- KPI cards (total scans, avg score, issues fixed)
- Score trends over time
- Severity breakdown charts
- Site rankings with grades (A-F)
- Top issues by frequency
- Drill-down to specific issues

### Reports & History (`/reports`)

Historical analysis:
- Scan history list
- Comparison view (before/after)
- Trend charts
- PDF report generation

### Competitor Benchmark (`/benchmark`)

Competitive analysis:
- Add competitor URLs
- Side-by-side score comparison
- Severity comparison charts

### Settings (`/settings`)

Configuration tabs:
- **General** - Default WCAG standard, storage settings
- **Scheduled Scans** - Create/manage recurring scans
- **GitHub** - Connect GitHub account for PR creation
- **Notifications** - Slack/Teams webhook setup
- **JIRA** - JIRA connection and field mapping
- **CI/CD** - Pipeline config generator

## Project Structure
```
src/
├── components/
│   ├── benchmarking/      # Competitor comparison
│   │   ├── CompetitorBenchmark.tsx
│   │   └── index.ts
│   ├── charts/            # Data visualization
│   │   ├── DonutChart.tsx
│   │   ├── ScoreCircle.tsx
│   │   ├── SeverityBar.tsx
│   │   ├── Sparkline.tsx
│   │   ├── TrendLine.tsx
│   │   └── index.ts
│   ├── executive/         # Executive dashboard
│   │   ├── ExecutiveDashboard.tsx
│   │   ├── KPICard.tsx
│   │   ├── KPIGrid.tsx
│   │   ├── SeverityBreakdown.tsx
│   │   ├── SiteRankings.tsx
│   │   ├── TopIssuesTable.tsx
│   │   └── index.ts
│   ├── findings/          # Issue display & management
│   │   ├── CreatePRModal.tsx
│   │   ├── ExportDropdown.tsx
│   │   ├── FindingDetails.tsx
│   │   ├── FindingDetailsDrawer.tsx
│   │   ├── FindingsFilterBar.tsx
│   │   ├── FindingsTable.tsx
│   │   ├── FixCodePreview.tsx
│   │   ├── IssuePatterns.tsx
│   │   ├── JiraExportModal.tsx
│   │   ├── SeverityBadge.tsx
│   │   └── index.ts
│   ├── layout/            # App layout
│   │   ├── PageContainer.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SidebarLayout.tsx
│   │   └── index.ts
│   ├── reports/           # Reports & history
│   │   ├── ComparisonView.tsx
│   │   ├── PDFReportButton.tsx
│   │   ├── ReportsView.tsx
│   │   ├── ScanHistory.tsx
│   │   ├── TrendCharts.tsx
│   │   └── index.ts
│   ├── scan/              # Scanner UI
│   │   ├── ImpactAnalysis.tsx
│   │   ├── QuickStats.tsx
│   │   ├── ScanForm.tsx
│   │   ├── ScanProgress.tsx
│   │   ├── ScanResults.tsx
│   │   └── index.ts
│   ├── scanner/           # Site scanner
│   │   └── SiteScanner.tsx
│   ├── settings/          # Settings panels
│   │   ├── CICDGenerator.tsx
│   │   ├── GitHubSettings.tsx
│   │   ├── JiraSettings.tsx
│   │   ├── ScheduleManager.tsx
│   │   ├── WebhookManager.tsx
│   │   └── index.ts
│   └── ui/                # Reusable UI components
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── EmptyState.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Pagination.tsx
│       ├── ProgressBar.tsx
│       ├── Select.tsx
│       ├── Spinner.tsx
│       ├── Table.tsx
│       ├── Tabs.tsx
│       ├── Textarea.tsx
│       └── index.ts
├── hooks/                 # Custom React hooks
│   ├── useApiStatus.ts    # API health monitoring
│   ├── useCompetitors.ts  # Competitor management
│   ├── useDashboardData.ts # Executive dashboard data
│   ├── useGitHub.ts       # GitHub integration
│   ├── useJiraExport.ts   # JIRA export
│   ├── useLocalStorage.ts # Persistent storage
│   ├── useScan.ts         # Single page scan
│   ├── useScans.ts        # Scan history
│   ├── useScanSSE.ts      # SSE scan streaming
│   ├── useSchedules.ts    # Scheduled scans
│   ├── useSiteScan.ts     # Multi-page scan
│   ├── useWebhooks.ts     # Webhook management
│   └── index.ts
├── pages/                 # Page components
│   ├── BenchmarkPage.tsx
│   ├── ExecutivePage.tsx
│   ├── ReportsPage.tsx
│   ├── ScanPage.tsx
│   ├── SettingsPage.tsx
│   ├── SiteScanPage.tsx
│   └── index.ts
├── types/                 # TypeScript types
│   ├── competitor.ts
│   ├── executive.ts
│   ├── fixes.ts
│   ├── github.ts
│   ├── index.ts
│   ├── jira.ts
│   ├── schedule.ts
│   └── webhook.ts
├── utils/                 # Utility functions
│   ├── api.ts             # API client
│   ├── constants.ts       # App constants
│   ├── export.ts          # CSV/JSON export
│   ├── falsePositives.ts  # False positive detection
│   ├── fingerprint.ts     # Issue fingerprinting
│   ├── issueTracker.ts    # Issue status tracking
│   ├── jiraMapper.ts      # JIRA field mapping
│   ├── patterns.ts        # Issue pattern detection
│   ├── pdfExport.ts       # PDF generation
│   ├── scoring.ts         # Score calculation
│   └── storage.ts         # LocalStorage management
├── App.tsx                # Main app component
├── main.tsx               # Entry point
└── index.css              # Global styles
```

## Hooks

### `useApiStatus`
Monitors API health with periodic checks.
```tsx
const { status } = useApiStatus();
// status: 'connected' | 'disconnected' | 'checking'
```

### `useScan`
Single page scanning with SSE streaming.
```tsx
const { scan, isScanning, progress, result, error } = useScan();
await scan('https://example.com', 'wcag21aa', 'desktop');
```

### `useSiteScan`
Multi-page site scanning.
```tsx
const { startScan, isScanning, phase, discoveredUrls, results } = useSiteScan();
await startScan('https://example.com', 10, 2, 'wcag21aa');
```

### `useGitHub`
GitHub integration for PR creation.
```tsx
const { 
  isConnected, 
  connect, 
  disconnect, 
  repositories, 
  createPR 
} = useGitHub();
```

### `useScans`
Scan history management.
```tsx
const { scans, saveScan, deleteScan, clearAll } = useScans();
```

### `useSchedules`
Scheduled scan management.
```tsx
const { schedules, createSchedule, updateSchedule, deleteSchedule } = useSchedules();
```

### `useWebhooks`
Webhook configuration.
```tsx
const { webhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook } = useWebhooks();
```

## Configuration

### Environment Variables

Create a `.env` file:
```env
# API URL (defaults to http://localhost:3001)
VITE_API_URL=http://localhost:3001
```

### API Base URL

The API URL can be configured in Settings → API or via environment variable.

## Docker

### Build
```bash
docker build -t allylab-dashboard .
```

### Run
```bash
docker run -d \
  --name allylab-dashboard \
  -p 8080:80 \
  allylab-dashboard
```

The dashboard will be available at `http://localhost:8080`.

## Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run typecheck

# Lint
npm run lint
```

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Recharts** - Data visualization
- **jsPDF** - PDF generation
- **ExcelJS** - Excel export

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## License

MIT