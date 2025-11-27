# Getting Started

This guide will help you get AllyLab up and running in minutes.

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+
- **Git** ([Download](https://git-scm.com/))

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/allylab.git
cd allylab
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Playwright Browser
```bash
npx playwright install chromium
```

### 4. Start Development Servers
```bash
npm run dev
```

This starts:
- **API** on http://localhost:3001
- **Dashboard** on http://localhost:5173

## Your First Scan

1. Open http://localhost:5173 in your browser
2. Enter a URL to scan (e.g., `https://example.com`)
3. Select WCAG standard (default: WCAG 2.1 AA)
4. Choose viewport (Desktop, Tablet, or Mobile)
5. Click **Scan Page**

![First Scan](https://via.placeholder.com/800x400?text=AllyLab+Scanner)

## Understanding Results

After scanning, you'll see:

### Score Card
- **Overall Score** (0-100) with letter grade (A-F)
- **Issue Counts** by severity (Critical, Serious, Moderate, Minor)

### Severity Levels

| Severity | Impact | Priority |
|----------|--------|----------|
| 🔴 Critical | Blocks access for users | Fix immediately |
| 🟠 Serious | Significant barriers | Fix soon |
| 🟡 Moderate | Some difficulty | Plan to fix |
| 🔵 Minor | Minor inconvenience | Fix when possible |

### Findings List
Each finding shows:
- Rule name and description
- Affected element (HTML snippet)
- CSS selector
- WCAG success criteria
- Help link for remediation

## Next Steps

- [[Features]] - Explore all features
- [[Configuration]] - Configure settings
- [[Custom Rules]] - Create custom checks
- [[Integrations]] - Connect GitHub, JIRA, Slack

## Quick Commands
```bash
# Start development
npm run dev

# Start API only
npm run dev:api

# Start Dashboard only
npm run dev:dashboard

# Build for production
npm run build

# Run linting
npm run lint

# Type check
npm run typecheck
```

## CLI Usage

Install the CLI for command-line scanning:
```bash
# Install globally
npm install -g @allylab/cli

# Scan a page
allylab scan https://example.com

# Scan with options
allylab scan https://example.com --standard wcag22aa --viewport mobile

# Scan entire site
allylab site https://example.com --max-pages 20

# CI/CD mode
allylab scan https://example.com --fail-on critical --format json
```

See [[CI/CD Integration]] for pipeline setup.