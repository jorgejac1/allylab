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

## Quick Start

```bash
# Scan a single page
allylab scan https://example.com

# Generate CI configuration
allylab init github-actions

# Create configuration file
allylab init config
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
| `--format <format>` | Output format (pretty, json, sarif, html, summary) | `pretty` |
| `-o, --output <file>` | Write results to file | - |
| `--api-url <url>` | API server URL | `http://localhost:3001` |
| `--timeout <ms>` | Request timeout in milliseconds | `60000` |
| `--ignore-rules <rules>` | Comma-separated list of rule IDs to ignore | - |
| `--verbose` | Show detailed output including config source | `false` |
| `-q, --quiet` | Minimal output (only errors and final result) | `false` |

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

# SARIF output for GitHub Code Scanning
allylab scan https://example.com --format sarif -o results.sarif

# Save to file
allylab scan https://example.com --output report.json

# Fail on critical issues (for CI/CD)
allylab scan https://example.com --fail-on critical

# Ignore specific rules
allylab scan https://example.com --ignore-rules color-contrast,image-alt

# Extended timeout for slow pages
allylab scan https://example.com --timeout 120000
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
| `--timeout <ms>` | Request timeout in milliseconds | `60000` |
| `--verbose` | Show detailed output including config source | `false` |
| `-q, --quiet` | Minimal output (only errors and final result) | `false` |

**Examples:**
```bash
# Scan up to 20 pages
allylab site https://example.com --max-pages 20

# Deep crawl (3 levels)
allylab site https://example.com --max-depth 3

# Full site scan with JSON output
allylab site https://example.com --max-pages 50 --format json --output site-report.json
```

### `allylab init [template]`

Generate configuration files for CI/CD integration.

```bash
# List available templates
allylab init --list

# Generate GitHub Actions workflow
allylab init github-actions

# Generate configuration file
allylab init config
```

**Available Templates:**

| Template | Description | File Created |
|----------|-------------|--------------|
| `github-actions` | GitHub Actions workflow with SARIF upload | `.github/workflows/accessibility.yml` |
| `gitlab-ci` | GitLab CI/CD pipeline configuration | `.gitlab-ci.yml` |
| `jenkins` | Jenkins pipeline configuration | `Jenkinsfile.accessibility` |
| `azure-pipelines` | Azure Pipelines configuration | `azure-pipelines-accessibility.yml` |
| `circleci` | CircleCI configuration | `.circleci/config.yml` |
| `config` | AllyLab configuration file | `.allylabrc.json` |

**Options:**

| Option | Description |
|--------|-------------|
| `-f, --force` | Overwrite existing files |
| `-l, --list` | List available templates |

### `allylab batch [file]`

Scan multiple URLs from a file or stdin.

```bash
# Scan URLs from file
allylab batch urls.txt

# Pipe URLs from command
cat urls.txt | allylab batch

# With options
allylab batch urls.txt --format json -o results.json --concurrency 5
```

**URL File Format:**
```
# Comments start with #
https://example.com
https://example.com/about
https://example.com/contact
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-c, --concurrency <number>` | Number of concurrent scans | `3` |
| `-s, --standard <standard>` | WCAG standard | `wcag21aa` |
| `-f, --fail-on <severity>` | Exit with code 1 if issues found | - |
| `--format <format>` | Output format (pretty, json, sarif, html) | `pretty` |
| `-o, --output <file>` | Write results to file | - |

### `allylab watch <url>`

Continuously scan a URL at regular intervals. Useful for monitoring during development.

```bash
# Watch with default 60s interval
allylab watch https://localhost:3000

# Custom interval (30 seconds)
allylab watch https://localhost:3000 --interval 30

# Only show output when results change
allylab watch https://localhost:3000 --on-change
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-i, --interval <seconds>` | Scan interval in seconds | `60` |
| `-s, --standard <standard>` | WCAG standard | `wcag21aa` |
| `-v, --viewport <viewport>` | Viewport size | `desktop` |
| `-f, --fail-on <severity>` | Alert if issues above threshold | - |
| `--on-change` | Only show output when results change | `false` |
| `--verbose` | Show detailed findings on each scan | `false` |

### `allylab info`

Display CLI version, configuration file path, and environment information.

```bash
allylab info
```

## Configuration

### Configuration Files

The CLI supports configuration files for persistent settings. Files are searched in order of priority:

1. `.allylabrc.json` (highest priority)
2. `.allylabrc`
3. `allylab.config.json`

Configuration files are searched from the current directory up to the filesystem root.

**Example `.allylabrc.json`:**
```json
{
  "apiUrl": "http://localhost:3001",
  "standard": "wcag21aa",
  "viewport": "desktop",
  "failOn": "serious",
  "format": "pretty",
  "timeout": 60000,
  "ignoreRules": [],
  "maxPages": 10,
  "maxDepth": 2
}
```

Generate a sample configuration file:
```bash
allylab init config
```

### Environment Variables

All settings can be configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLYLAB_API_URL` | API server URL | `http://localhost:3001` |
| `ALLYLAB_STANDARD` | WCAG standard | `wcag21aa` |
| `ALLYLAB_VIEWPORT` | Viewport size | `desktop` |
| `ALLYLAB_FAIL_ON` | Fail threshold severity | - |
| `ALLYLAB_FORMAT` | Output format | `pretty` |
| `ALLYLAB_TIMEOUT` | Request timeout in ms | `60000` |
| `ALLYLAB_IGNORE_RULES` | Comma-separated rule IDs to ignore | - |
| `ALLYLAB_MAX_PAGES` | Maximum pages to scan | `10` |
| `ALLYLAB_MAX_DEPTH` | Maximum crawl depth | `2` |

**Example:**
```bash
export ALLYLAB_API_URL=https://api.allylab.example.com
export ALLYLAB_FAIL_ON=serious
allylab scan https://example.com
```

### Configuration Priority

Configuration is loaded in this order (highest priority first):

1. **CLI options** (e.g., `--standard wcag22aa`)
2. **Environment variables** (e.g., `ALLYLAB_STANDARD`)
3. **Configuration file** (e.g., `.allylabrc.json`)
4. **Default values**

## CI/CD Integration

### GitHub Actions (with SARIF)

Generate a complete workflow with SARIF support for GitHub Code Scanning:
```bash
allylab init github-actions
```

This creates `.github/workflows/accessibility.yml`:
```yaml
name: Accessibility Check

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  accessibility:
    name: Accessibility Scan
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Start application
        run: npm start &
        env:
          CI: true

      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 60000

      - name: Install AllyLab CLI
        run: npm install -g @allylab/cli

      - name: Run accessibility scan
        run: allylab scan http://localhost:3000 --format sarif -o results.sarif --fail-on serious

      - name: Upload SARIF results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: results.sarif
```

SARIF results appear in your repository's **Security** tab under **Code scanning alerts**.

### GitLab CI
```bash
allylab init gitlab-ci
```

### Jenkins
```bash
allylab init jenkins
```

### Azure Pipelines
```bash
allylab init azure-pipelines
```

### CircleCI
```bash
allylab init circleci
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

### SARIF

Static Analysis Results Interchange Format for GitHub Code Scanning integration.
```bash
allylab scan https://example.com --format sarif -o results.sarif
```

The SARIF output includes:
- Tool information (AllyLab version)
- Rule definitions with WCAG mappings
- Issue locations with element selectors
- Severity mapping to SARIF levels

### Summary

Compact single-line output.
```
85/100 (Good)
Total Issues: 8
Critical: 0 | Serious: 2 | Moderate: 5 | Minor: 1
```

## Ignoring Rules

You can ignore specific accessibility rules that don't apply to your use case:

```bash
# Via CLI flag
allylab scan https://example.com --ignore-rules color-contrast,image-alt

# Via environment variable
export ALLYLAB_IGNORE_RULES="color-contrast,image-alt"
allylab scan https://example.com

# Via configuration file
{
  "ignoreRules": ["color-contrast", "image-alt"]
}
```

Common rules to consider ignoring:
- `color-contrast` - Color contrast issues
- `image-alt` - Missing alt text on images
- `link-name` - Links without accessible names
- `region` - Content not in landmarks

**Note:** Ignoring rules should be done carefully. Each ignored rule may hide real accessibility issues.

## Development
```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run locally
node dist/index.js scan https://example.com

# Link for local testing
npm link
allylab scan https://example.com
```

## License

MIT
