import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, existsSync } from 'fs';
import { fetchScan, type ScanResult, type ScanAuthOptions } from '../utils/api.js';
import { formatResults, formatScore } from '../utils/output.js';
import { formatSarif } from '../utils/sarif.js';
import { formatHtml } from '../utils/html.js';
import { writeOutput } from '../utils/file.js';
import { loadConfig, getConfigPath } from '../utils/config.js';

interface ScanOptions {
  standard?: string;
  viewport?: string;
  failOn?: string;
  format?: string;
  output?: string;
  apiUrl?: string;
  timeout?: string;
  ignoreRules?: string;
  verbose?: boolean;
  quiet?: boolean;
  // Authentication options
  cookies?: string;
  storageState?: string;
  header?: string[];
  basicAuth?: string;
}

/**
 * Parse authentication options from CLI flags
 */
function parseAuthOptions(options: ScanOptions): ScanAuthOptions | undefined {
  const auth: ScanAuthOptions = {};

  // Parse cookies (JSON string or file path)
  if (options.cookies) {
    try {
      if (existsSync(options.cookies)) {
        const content = readFileSync(options.cookies, 'utf-8');
        auth.cookies = JSON.parse(content);
      } else {
        auth.cookies = JSON.parse(options.cookies);
      }
    } catch (error) {
      throw new Error(`Failed to parse cookies: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  // Parse storage state file
  if (options.storageState) {
    try {
      if (!existsSync(options.storageState)) {
        throw new Error(`Storage state file not found: ${options.storageState}`);
      }
      const content = readFileSync(options.storageState, 'utf-8');
      auth.storageState = JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse storage state: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  // Parse headers
  if (options.header && options.header.length > 0) {
    auth.headers = {};
    for (const h of options.header) {
      const colonIndex = h.indexOf(':');
      if (colonIndex === -1) {
        throw new Error(`Invalid header format: ${h}. Expected "Name: Value"`);
      }
      const name = h.substring(0, colonIndex).trim();
      const value = h.substring(colonIndex + 1).trim();
      auth.headers[name] = value;
    }
  }

  // Parse basic auth
  if (options.basicAuth) {
    const colonIndex = options.basicAuth.indexOf(':');
    if (colonIndex === -1) {
      throw new Error('Invalid basic auth format. Expected "username:password"');
    }
    auth.basicAuth = {
      username: options.basicAuth.substring(0, colonIndex),
      password: options.basicAuth.substring(colonIndex + 1),
    };
  }

  // Return undefined if no auth options provided
  if (!auth.cookies && !auth.storageState && !auth.headers && !auth.basicAuth) {
    return undefined;
  }

  return auth;
}

/**
 * Collect repeatable options into an array
 */
function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

/**
 * Filter findings based on ignored rules
 */
function filterFindings(result: ScanResult, ignoreRules: string[]): ScanResult {
  if (ignoreRules.length === 0) return result;

  const filteredFindings = result.findings.filter(
    finding => !ignoreRules.includes(finding.ruleId)
  );

  // Recalculate counts
  let critical = 0;
  let serious = 0;
  let moderate = 0;
  let minor = 0;

  for (const finding of filteredFindings) {
    switch (finding.impact) {
      case 'critical':
        critical++;
        break;
      case 'serious':
        serious++;
        break;
      case 'moderate':
        moderate++;
        break;
      case 'minor':
        minor++;
        break;
    }
  }

  return {
    ...result,
    findings: filteredFindings,
    totalIssues: filteredFindings.length,
    critical,
    serious,
    moderate,
    minor,
  };
}

export const scanCommand = new Command('scan')
  .description('Scan a single page for accessibility issues')
  .argument('<url>', 'URL to scan')
  .option('-s, --standard <standard>', 'WCAG standard (wcag21aa, wcag22aa, wcag21a, wcag2aa, wcag2a)')
  .option('-v, --viewport <viewport>', 'Viewport size (desktop, tablet, mobile)')
  .option('-f, --fail-on <severity>', 'Exit with code 1 if issues of this severity or higher are found (critical, serious, moderate, minor)')
  .option('--format <format>', 'Output format (pretty, json, sarif, summary)')
  .option('-o, --output <file>', 'Write results to file')
  .option('--api-url <url>', 'API server URL')
  .option('--timeout <ms>', 'Request timeout in milliseconds')
  .option('--ignore-rules <rules>', 'Comma-separated list of rule IDs to ignore')
  .option('--verbose', 'Show detailed output including config source')
  .option('-q, --quiet', 'Minimal output (only errors and final result)')
  // Authentication options
  .option('--cookies <json|file>', 'Cookies as JSON array or path to JSON file')
  .option('--storage-state <file>', 'Path to Playwright storage state JSON file')
  .option('--header <header>', 'HTTP header in "Name: Value" format (repeatable)', collect, [])
  .option('--basic-auth <credentials>', 'Basic auth as username:password')
  .action(async (url: string, options: ScanOptions) => {
    // Load config with CLI options as overrides
    const config = loadConfig({
      standard: options.standard,
      viewport: options.viewport,
      failOn: options.failOn,
      format: options.format,
      output: options.output,
      apiUrl: options.apiUrl,
      timeout: options.timeout ? parseInt(options.timeout, 10) : undefined,
      ignoreRules: options.ignoreRules?.split(',').map(r => r.trim()),
    });

    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const isQuiet = options.quiet || config.format === 'json' || config.format === 'sarif' || config.format === 'html';

    if (!isQuiet) {
      console.log();
      console.log(chalk.bold.blue('🔍 AllyLab - Accessibility Scanner'));
      console.log();
      console.log(`  URL:      ${chalk.cyan(url)}`);
      console.log(`  Standard: ${chalk.yellow(config.standard.toUpperCase())}`);
      console.log(`  Viewport: ${chalk.yellow(config.viewport)}`);

      if (options.verbose) {
        const configPath = getConfigPath();
        if (configPath) {
          console.log(`  Config:   ${chalk.dim(configPath)}`);
        }
        if (config.ignoreRules.length > 0) {
          console.log(`  Ignoring: ${chalk.dim(config.ignoreRules.join(', '))}`);
        }
      }

      console.log();
      console.log(chalk.dim('━'.repeat(50)));
      console.log();
    }

    // Parse authentication options
    let auth: ScanAuthOptions | undefined;
    try {
      auth = parseAuthOptions(options);
    } catch (error) {
      console.error(chalk.red(`\nAuthentication error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }

    if (!isQuiet && auth) {
      console.log(`  Auth:     ${chalk.green('Enabled')} (${Object.keys(auth).join(', ')})`);
      console.log();
    }

    const spinner = isQuiet ? null : ora('Scanning page...').start();

    try {
      let result = await fetchScan(config.apiUrl, url, config.standard, config.viewport, config.timeout, auth);

      // Apply rule filtering
      result = filterFindings(result, config.ignoreRules);

      if (spinner) {
        spinner.succeed('Scan complete!');
        console.log();
      }

      // Output results
      if (config.format === 'json') {
        const jsonOutput = JSON.stringify(result, null, 2);
        if (config.output) {
          writeOutput(config.output, jsonOutput);
          if (!isQuiet) {
            console.log(chalk.green(`✓ Results written to ${config.output}`));
          }
        } else {
          console.log(jsonOutput);
        }
      } else if (config.format === 'sarif') {
        const sarifOutput = formatSarif(result);
        if (config.output) {
          writeOutput(config.output, sarifOutput);
          if (!isQuiet) {
            console.log(chalk.green(`✓ SARIF results written to ${config.output}`));
          }
        } else {
          console.log(sarifOutput);
        }
      } else if (config.format === 'html') {
        const htmlOutput = formatHtml(result);
        if (config.output) {
          writeOutput(config.output, htmlOutput);
          if (!isQuiet) {
            console.log(chalk.green(`✓ HTML report written to ${config.output}`));
          }
        } else {
          console.log(htmlOutput);
        }
      } else if (config.format === 'summary') {
        console.log(formatScore(result.score));
        console.log(`Total Issues: ${result.totalIssues}`);
        console.log(`Critical: ${result.critical} | Serious: ${result.serious} | Moderate: ${result.moderate} | Minor: ${result.minor}`);
      } else {
        console.log(formatResults(result));

        if (config.output) {
          writeOutput(config.output, JSON.stringify(result, null, 2));
          console.log(chalk.green(`\n✓ Results written to ${config.output}`));
        }
      }

      // Check fail threshold
      if (config.failOn) {
        const severityLevels = ['minor', 'moderate', 'serious', 'critical'];
        const thresholdIndex = severityLevels.indexOf(config.failOn);

        if (thresholdIndex === -1) {
          console.error(chalk.red(`\nInvalid severity: ${config.failOn}`));
          console.error('Valid values: critical, serious, moderate, minor');
          process.exit(2);
        }

        let failCount = 0;
        if (thresholdIndex <= 3) failCount += result.critical;
        if (thresholdIndex <= 2) failCount += result.serious;
        if (thresholdIndex <= 1) failCount += result.moderate;
        if (thresholdIndex <= 0) failCount += result.minor;

        if (failCount > 0) {
          if (!isQuiet) {
            console.log();
            console.log(chalk.red.bold(`❌ Scan failed: ${failCount} ${config.failOn}+ issues found`));
          }
          process.exit(1);
        } else if (!isQuiet) {
          console.log();
          console.log(chalk.green.bold(`✓ Scan passed: No ${config.failOn}+ issues found`));
        }
      }
    } catch (error) {
      if (spinner) {
        spinner.fail('Scan failed');
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`\nError: ${message}`));
      if (!isQuiet) {
        console.error(chalk.dim('\nMake sure the AllyLab API is running on ' + config.apiUrl));
      }
      process.exit(1);
    }
  });
