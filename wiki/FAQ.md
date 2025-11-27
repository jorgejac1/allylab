# Frequently Asked Questions

## General

### What is AllyLab?

AllyLab is an enterprise-grade web accessibility scanner that helps development teams find and fix WCAG compliance issues. It includes AI-powered fix suggestions, GitHub integration for PR creation, and comprehensive reporting.

### Is AllyLab free?

Yes, AllyLab is open source and MIT licensed. You can use it freely for personal and commercial projects.

### What WCAG standards does AllyLab support?

- WCAG 2.0 Level A
- WCAG 2.0 Level AA
- WCAG 2.1 Level A
- WCAG 2.1 Level AA (recommended)
- WCAG 2.2 Level AA

### How accurate is the scanning?

AllyLab uses [axe-core](https://github.com/dequelabs/axe-core), the industry-standard accessibility testing engine. It catches approximately 57% of WCAG issues automatically. Manual testing is still recommended for complete coverage.

---

## Scanning

### Why doesn't my scan find any issues?

Possible reasons:
1. The site is actually accessible ✅
2. Content is rendered via JavaScript (try waiting for page load)
3. Issues are in iframes (not scanned by default)
4. Wrong URL was scanned

### Can I scan authenticated pages?

Currently, AllyLab scans public pages only. Authenticated page scanning is planned for a future release.

### How long does a scan take?

- Single page: 5-15 seconds
- Site scan (10 pages): 1-3 minutes
- Large site (50+ pages): 10-15 minutes

### Can I scan localhost?

Yes, if the API can reach your local development server. Use the full URL (e.g., `http://localhost:3000`).

---

## AI Fixes

### How do AI fix suggestions work?

AllyLab uses Claude AI to analyze accessibility issues and generate contextual fix suggestions. It considers:
- The specific violation
- HTML context
- Target framework (React, Vue, etc.)
- WCAG requirements

### Are AI fixes always correct?

AI fixes are suggestions, not guaranteed solutions. Always review before applying. The confidence level (High/Medium/Low) indicates reliability.

### What frameworks are supported for fixes?

- HTML
- React/JSX
- Vue
- Angular
- Svelte (coming soon)

---

## GitHub Integration

### What GitHub permissions are needed?

The `repo` scope is required for:
- Reading repository contents
- Creating branches
- Creating pull requests
- Committing files

### Can I use GitHub Enterprise?

Yes, set the `GITHUB_API_URL` environment variable:
```env
GITHUB_API_URL=https://github.your-company.com/api/v3
```

### Do PRs count against my GitHub rate limit?

Yes, PRs use your Personal Access Token which has rate limits (5000 requests/hour for authenticated users).

---

## Custom Rules

### Why create custom rules?

Custom rules let you:
- Enforce organization-specific standards
- Check for patterns axe-core doesn't cover
- Create project-specific validations
- Share rules across teams

### Do custom rules run automatically?

Yes, when enabled, custom rules run alongside axe-core during every scan.

### Can I share rules with my team?

Yes, export rules as JSON and share the file. Team members can import them.

---

## Performance & Limits

### How many scans can I store?

By default, 100 scans. Configurable in Settings → General.

### Is there a rate limit?

No built-in rate limits for self-hosted instances. For production, consider implementing:
- 100 scans/hour
- 1000 API requests/minute

### What are the system requirements?

- Node.js 18+
- 2GB RAM minimum (4GB recommended)
- 1GB disk space

---

## CI/CD

### Which CI systems are supported?

- GitHub Actions
- GitLab CI
- Harness
- Jenkins
- CircleCI
- Any system that can run Node.js

### How do I fail builds on accessibility issues?

Use the `--fail-on` flag:
```bash
allylab scan https://example.com --fail-on critical
```

### Can I set a minimum score?

Yes, check the score in your CI script:
```bash
SCORE=$(allylab scan $URL --format json | jq '.score')
if [ $SCORE -lt 80 ]; then exit 1; fi
```

---

## Integrations

### Which notification platforms are supported?

- Slack (Block Kit format)
- Microsoft Teams (Adaptive Cards)
- Generic webhooks (JSON)

### Can I export to tools other than JIRA?

Currently only JIRA is supported. Export to CSV/JSON and import to other tools manually.

### Is there an API?

Yes, full REST API. See [[API Reference]] for documentation.

---

## Troubleshooting

### Why do I get CORS errors?

1. Ensure the API server is running
2. Check the API URL in Settings → API
3. The API should be on localhost:3001

### Why is the dashboard slow?

1. Too many stored scans - clear old data
2. Large scan results - reduce findings
3. Browser memory - close other tabs

### How do I reset everything?

Settings → General → Danger Zone → Clear All Data

---

## Contributing

### How can I contribute?

See [CONTRIBUTING.md](https://github.com/yourusername/allylab/blob/main/CONTRIBUTING.md):
1. Fork the repository
2. Create a feature branch
3. Make changes
4. Submit a pull request

### How do I report bugs?

Open an issue on [GitHub](https://github.com/yourusername/allylab/issues) with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- System information

### Can I request features?

Yes! Open a [GitHub Discussion](https://github.com/yourusername/allylab/discussions) or issue with the "enhancement" label.