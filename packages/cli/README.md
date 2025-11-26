# @allylab/cli

Command-line interface for AllyLab accessibility scanning. Perfect for CI/CD pipelines and automated testing.

## Installation
```bash
# Install globally
npm install -g @allylab/cli

# Or use npx
npx @allylab/cli scan https://example.com
```

## Prerequisites

The AllyLab API must be running for the CLI to work:
```bash
# Start the API
cd ../api
npm run dev
```

## Commands

### `allylab scan <url>`

Scan a single page for accessibility issues.
```bash
allylab scan https://example.com
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --standard <standard>` | WCAG standard (wcag21aa, wcag22aa, wcag21a, wcag2aa, wcag2a) | `wcag21aa` |
| `-v, --viewport <viewport>` | Viewport size (desktop, tablet, mobile) | `desktop` |
| `-f, --fail-on <severity>` | Exit with code 1 if issues found (critical, serious, moderate, minor) | - |
| `--format <format>` | Output format (pretty, json, summary) | `pretty` |
| `-o, --output <file>` | Write results to file | - |
| `--api-url <url>` | API server URL | `http://localhost:3001` |

**Examples:**
```bash
# Basic scan
allylab scan https://example.com

# WCAG 2.2 AA standard
allylab scan https://example.com --standard wcag22aa

# Mobile viewport
allylab scan https://example.com --viewport mobile

# JSON output
allylab scan https://example.com --format json

# Save to file
allylab scan https://example.com --output report.json

# Fail on critical issues (for CI/CD)
allylab scan https://example.com --fail-on critical
```

### `allylab site <url>`

Crawl and scan multiple pages across a website.
```bash
allylab site https://example.com --max-pages 10
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --max-pages <number>` | Maximum pages to scan | `10` |
| `-d, --max-depth <number>` | Maximum crawl depth | `2` |
| `-s, --standard <standard>` | WCAG standard | `wcag21aa` |
| `-f, --fail-on <severity>` | Exit with code 1 if issues found | - |
| `--format <format>` | Output format (pretty, json, summary) | `pretty` |
| `-o, --output <file>` | Write results to file | - |
| `--api-url <url>` | API server URL | `http://localhost:3001` |

**Examples:**
```bash
# Scan up to 20 pages
allylab site https://example.com --max-pages 20

# Deep crawl (3 levels)
allylab site https://example.com --max-depth 3

# Full site scan with JSON output
allylab site https://example.com --max-pages 50 --format json --output site-report.json
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Accessibility Check
on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Start API
        run: |
          npm run dev:api &
          sleep 10
      
      - name: Run accessibility scan
        run: npx @allylab/cli scan https://your-site.com --fail-on critical
```

### GitLab CI
```yaml
accessibility:
  image: node:20
  script:
    - npm install -g @allylab/cli
    - allylab scan $CI_ENVIRONMENT_URL --fail-on serious --format json --output a11y-report.json
  artifacts:
    paths:
      - a11y-report.json
    when: always
```

### Jenkins
```groovy
pipeline {
    agent any
    stages {
        stage('Accessibility Scan') {
            steps {
                sh 'npx @allylab/cli scan https://your-site.com --fail-on critical'
            }
        }
    }
}
```

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | Scan completed successfully (or no issues above threshold) |
| `1` | Issues found above `--fail-on` threshold |
| `2` | Invalid arguments or configuration error |

## Output Formats

### Pretty (default)

Human-readable output with colors and formatting.
```
🔍 AllyLab - Accessibility Scanner

  URL:      https://example.com
  Standard: WCAG21AA
  Viewport: desktop

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✔ Scan complete!

📊 Results

  Score:     85/100 (Good)

  Issues Found:
    🔴 Critical:   0
    🟠 Serious:    2
    🟡 Moderate:   5
    🔵 Minor:      1
    ────────────────────
    Total:        8
```

### JSON

Machine-readable JSON output for processing.
```json
{
  "url": "https://example.com",
  "score": 85,
  "totalIssues": 8,
  "critical": 0,
  "serious": 2,
  "moderate": 5,
  "minor": 1,
  "findings": [...]
}
```

### Summary

Compact single-line output.
```
85/100 (Good)
Total Issues: 8
Critical: 0 | Serious: 2 | Moderate: 5 | Minor: 1
```

## Development
```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js scan https://example.com

# Link for local testing
npm link
allylab scan https://example.com
```

## License

MIT