# Changelog

All notable changes to the AllyLab CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-31

### Added

#### New Commands
- **`allylab batch`** - Scan multiple URLs from a file or stdin with configurable concurrency
- **`allylab watch`** - Continuously monitor a URL at regular intervals with change detection
- **`allylab init`** - Generate CI/CD configuration files for:
  - GitHub Actions (with SARIF upload)
  - GitLab CI
  - Jenkins
  - Azure Pipelines
  - CircleCI
- **`allylab info`** - Display CLI version, config path, and environment info

#### New Output Formats
- **HTML reports** - Beautiful, shareable HTML accessibility reports
- **SARIF format** - Static Analysis Results Interchange Format for GitHub Code Scanning

#### Configuration System
- **Config files** - Support for `.allylabrc.json`, `.allylabrc`, and `allylab.config.json`
- **Environment variables** - All options configurable via `ALLYLAB_*` environment variables
- **Config priority** - CLI options > Environment variables > Config file > Defaults

#### New Options
- `--timeout <ms>` - Configurable request timeout
- `--ignore-rules <rules>` - Comma-separated rule IDs to ignore
- `--verbose` - Show config source and detailed info
- `--quiet` / `-q` - Minimal output for scripts
- `--concurrency` - Parallel scans for batch command
- `--on-change` - Only output when results change (watch command)

### Changed
- Improved error messages with helpful hints
- Better progress indicators with real-time updates
- Consistent exit codes across all commands

### Fixed
- URL normalization for domains without protocol
- Proper handling of large scan results

## [1.0.0] - 2026-01-15

### Added
- Initial release
- `allylab scan` command for single page scanning
- `allylab site` command for multi-page site scanning
- JSON and summary output formats
- `--fail-on` threshold for CI/CD integration
- WCAG 2.0, 2.1, 2.2 standard support
- Desktop, tablet, mobile viewport testing
