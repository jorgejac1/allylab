# CI/CD Integration

Integrate AllyLab into your continuous integration and deployment pipelines.

## Overview

CI/CD integration enables:
- Automated accessibility testing on every commit
- Fail builds on critical issues
- Score threshold enforcement
- Artifact generation for reports

## CLI Installation
```bash
# Install globally
npm install -g @allylab/cli

# Or use npx (no install)
npx @allylab/cli scan https://example.com
```

## CLI Commands

### Single Page Scan
```bash
allylab scan <url> [options]

Options:
  -s, --standard <standard>  WCAG standard (wcag21aa, wcag22aa)
  -v, --viewport <viewport>  Viewport (desktop, tablet, mobile)
  -f, --fail-on <severity>   Exit 1 if issues found (critical, serious)
  --format <format>          Output format (pretty, json, summary)
  -o, --output <file>        Write results to file
  --api-url <url>            API server URL
```

### Site Scan
```bash
allylab site <url> [options]

Options:
  -p, --max-pages <number>   Max pages to scan (default: 10)
  -d, --max-depth <number>   Max crawl depth (default: 2)
  -s, --standard <standard>  WCAG standard
  -f, --fail-on <severity>   Exit 1 if issues found
  --format <format>          Output format
  -o, --output <file>        Write results to file
```

## Exit Codes

| Code | Meaning                                  |
|------|------------------------------------------|
| 0    | Success (no issues or below threshold)   |
| 1    | Failed (issues found matching --fail-on) |
| 2    | Error (scan failed)                      |

---

## GitHub Actions

### Basic Workflow
```yaml
name: Accessibility

on: [push, pull_request]

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
        run: npx @allylab/cli scan https://your-site.com --fail-on critical
```

### With AllyLab API
```yaml
name: Accessibility

on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    services:
      allylab-api:
        image: allylab-api:latest
        ports:
          - 3001:3001
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run accessibility scan
        run: |
          npx @allylab/cli scan https://your-site.com \
            --api-url http://localhost:3001 \
            --fail-on serious \
            --format json \
            --output a11y-report.json
      
      - name: Upload report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: accessibility-report
          path: a11y-report.json
```

### Deployment Preview Scan
```yaml
name: Preview Accessibility

on:
  deployment_status:

jobs:
  accessibility:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - name: Scan deployment
        run: |
          npx @allylab/cli scan ${{ github.event.deployment_status.target_url }} \
            --fail-on critical
```

---

## GitLab CI

### Basic Pipeline
```yaml
accessibility:
  image: node:20
  script:
    - npx @allylab/cli scan https://your-site.com --fail-on serious
```

### With Artifacts
```yaml
accessibility:
  image: node:20
  script:
    - npx @allylab/cli scan https://your-site.com \
        --format json \
        --output a11y-report.json \
        --fail-on serious
  artifacts:
    paths:
      - a11y-report.json
    when: always
    expire_in: 30 days
```

### Merge Request Only
```yaml
accessibility:
  image: node:20
  only:
    - merge_requests
  script:
    - npx @allylab/cli scan $CI_ENVIRONMENT_URL --fail-on critical
```

### With GitLab Integration

When GitLab is connected in AllyLab dashboard, you can automatically create MRs with fixes:

```yaml
accessibility:
  image: node:20
  script:
    - |
      # Run scan and save results
      npx @allylab/cli scan $CI_ENVIRONMENT_URL \
        --format json \
        --output scan-results.json

      # If issues found, AllyLab dashboard can generate fixes
      # and create MRs directly to your GitLab project
  artifacts:
    paths:
      - scan-results.json
    reports:
      accessibility: scan-results.json
```

> **Note:** For automatic MR creation, ensure GitLab is connected in **Settings** → **Git** with appropriate repository permissions.

---

## Harness

### Pipeline YAML
```yaml
pipeline:
  name: Accessibility Pipeline
  stages:
    - stage:
        name: Accessibility Scan
        type: CI
        spec:
          execution:
            steps:
              - step:
                  type: Run
                  name: Run Scan
                  spec:
                    shell: Bash
                    command: |
                      npm install -g @allylab/cli
                      allylab scan https://your-site.com \
                        --fail-on serious \
                        --format json \
                        --output report.json
```

---

## Jenkins

### Declarative Pipeline
```groovy
pipeline {
    agent any
    
    tools {
        nodejs 'node-20'
    }
    
    stages {
        stage('Accessibility') {
            steps {
                sh 'npm install -g @allylab/cli'
                sh 'allylab scan https://your-site.com --fail-on critical --format json --output a11y-report.json'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'a11y-report.json'
                }
            }
        }
    }
}
```

---

## CircleCI
```yaml
version: 2.1

jobs:
  accessibility:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Run accessibility scan
          command: |
            npx @allylab/cli scan https://your-site.com \
              --fail-on serious \
              --format json \
              --output a11y-report.json
      - store_artifacts:
          path: a11y-report.json

workflows:
  main:
    jobs:
      - accessibility
```

---

## Configuration Generator

AllyLab includes a built-in CI/CD config generator:

1. Navigate to **Settings** → **CI/CD**
2. Select platform
3. Configure options:
   - URLs to scan
   - Fail thresholds
   - Artifact settings
4. Click **Copy** or **Download**

### Options

| Option           | Description                        |
|------------------|------------------------------------|
| Platform         | GitHub Actions, GitLab CI, Harness |
| Schedule         | On Push, Daily, Weekly, Manual     |
| URLs             | List of URLs to scan               |
| Min Score        | Fail if score below threshold      |
| Fail on Critical | Fail on critical issues            |
| Fail on Serious  | Fail on serious issues             |
| Upload Artifacts | Save scan results                  |

---

## Best Practices

### 1. Progressive Thresholds

Start strict and loosen as needed:
```bash
# Start with critical only
--fail-on critical

# Then add serious
--fail-on serious

# Eventually all
--fail-on minor
```

### 2. Score Thresholds

Use score thresholds for gradual improvement:
```yaml
# Fail if score below 70
- run: |
    SCORE=$(npx @allylab/cli scan $URL --format json | jq '.score')
    if [ $SCORE -lt 70 ]; then exit 1; fi
```

### 3. Baseline Comparison

Compare against baseline:
```yaml
- run: |
    npx @allylab/cli scan $URL --format json --output current.json
    # Compare with stored baseline
    node compare-baseline.js baseline.json current.json
```

### 4. Multiple URLs

Scan multiple pages:
```yaml
- run: |
    for url in https://site.com https://site.com/about https://site.com/contact; do
      npx @allylab/cli scan $url --fail-on critical
    done
```

### 5. Environment-Specific

Different thresholds per environment:
```yaml
scan-staging:
  script: allylab scan $STAGING_URL --fail-on serious

scan-production:
  script: allylab scan $PROD_URL --fail-on critical
```

---

## Troubleshooting

### API Connection Failed

Ensure AllyLab API is running:
```bash
curl http://localhost:3001/health
```

### Timeout Errors

Increase scan timeout:
```bash
--timeout 120000  # 2 minutes
```

### Browser Issues

Playwright needs browsers:
```bash
npx playwright install chromium
```