# Getting Started

This guide will help you get AllyLab up and running in minutes.

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+
- **Git** ([Download](https://git-scm.com/))

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/jorgejac1/allylab.git
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
- **Website** on http://localhost:3000 (if started)

## Authentication

### Development Mode (Default)

AllyLab uses mock authentication in development, allowing you to test without setting up Clerk or Stripe.

#### Via Website Login
1. Start the website: `npm run dev:website`
2. Go to http://localhost:3000/sign-in
3. Use a demo account or create a new one
4. Click "Go to Dashboard" - you'll be automatically authenticated

#### Via Dashboard Direct Access
1. Open http://localhost:5173 directly
2. Use the user switcher dropdown to switch between roles
3. Test different permission levels (Admin, Manager, Developer, Viewer, Compliance)

### Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@acme.com | admin123 | Admin |
| manager@acme.com | manager123 | Manager |
| dev@acme.com | dev123 | Developer |
| viewer@acme.com | viewer123 | Viewer |
| compliance@acme.com | compliance123 | Compliance |

### Production Mode

For production authentication, see [[Auth-Setup]].

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
- [[Integrations]] - Connect GitHub, GitLab, JIRA, Slack

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

## Running Tests
```bash
# Run unit tests
npm run test

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests (requires dev server)
npx playwright test --project=chromium

# Run specific E2E test file
npx playwright test e2e/scan-workflow.spec.ts

# View E2E test report
npx playwright show-report
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