import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { fetchSiteScan } from '../utils/api.js';
import { formatSiteResults, formatScore } from '../utils/output.js';
import { writeOutput } from '../utils/file.js';
import { loadConfig, getConfigPath } from '../utils/config.js';

interface SiteOptions {
  maxPages?: string;
  maxDepth?: string;
  standard?: string;
  failOn?: string;
  format?: string;
  output?: string;
  apiUrl?: string;
  timeout?: string;
  verbose?: boolean;
  quiet?: boolean;
}

export const siteCommand = new Command('site')
  .description('Crawl and scan multiple pages across a website')
  .argument('<url>', 'Website URL to scan')
  .option('-p, --max-pages <number>', 'Maximum pages to scan')
  .option('-d, --max-depth <number>', 'Maximum crawl depth')
  .option('-s, --standard <standard>', 'WCAG standard')
  .option('-f, --fail-on <severity>', 'Exit with code 1 if issues of this severity or higher are found')
  .option('--format <format>', 'Output format (pretty, json, summary)')
  .option('-o, --output <file>', 'Write results to file')
  .option('--api-url <url>', 'API server URL')
  .option('--timeout <ms>', 'Request timeout in milliseconds')
  .option('--verbose', 'Show detailed output including config source')
  .option('-q, --quiet', 'Minimal output (only errors and final result)')
  .action(async (url: string, options: SiteOptions) => {
    // Load config with CLI options as overrides
    const config = loadConfig({
      standard: options.standard,
      maxPages: options.maxPages ? parseInt(options.maxPages, 10) : undefined,
      maxDepth: options.maxDepth ? parseInt(options.maxDepth, 10) : undefined,
      failOn: options.failOn,
      format: options.format,
      output: options.output,
      apiUrl: options.apiUrl,
      timeout: options.timeout ? parseInt(options.timeout, 10) : undefined,
    });

    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const isQuiet = options.quiet || config.format === 'json';

    if (!isQuiet) {
      console.log();
      console.log(chalk.bold.blue('🌐 AllyLab - Site Scanner'));
      console.log();
      console.log(`  URL:       ${chalk.cyan(url)}`);
      console.log(`  Max Pages: ${chalk.yellow(config.maxPages)}`);
      console.log(`  Max Depth: ${chalk.yellow(config.maxDepth)}`);
      console.log(`  Standard:  ${chalk.yellow(config.standard.toUpperCase())}`);

      if (options.verbose) {
        const configPath = getConfigPath();
        if (configPath) {
          console.log(`  Config:    ${chalk.dim(configPath)}`);
        }
      }

      console.log();
      console.log(chalk.dim('━'.repeat(50)));
      console.log();
    }

    const spinner = isQuiet ? null : ora('Discovering pages...').start();

    try {
      const result = await fetchSiteScan(
        config.apiUrl,
        url,
        config.maxPages,
        config.maxDepth,
        config.standard,
        (event) => {
          if (!spinner) return;

          switch (event.type) {
            case 'crawl-complete': {
              const totalFound = event.data.totalFound as number;
              spinner.text = `Found ${totalFound} pages. Scanning...`;
              break;
            }
            case 'page-start': {
              const index = event.data.index as number;
              const total = event.data.total as number;
              const pageUrl = event.data.url as string;
              spinner.text = `Scanning page ${index}/${total}: ${new URL(pageUrl).pathname}`;
              break;
            }
            case 'page-complete':
              // Keep spinner going
              break;
          }
        }
      );

      if (spinner) {
        spinner.succeed(`Scanned ${result.pagesScanned} pages`);
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
      } else if (config.format === 'summary') {
        console.log(formatScore(result.averageScore));
        console.log(`Pages Scanned: ${result.pagesScanned}`);
        console.log(`Total Issues: ${result.totalIssues}`);
        console.log(`Critical: ${result.critical} | Serious: ${result.serious} | Moderate: ${result.moderate} | Minor: ${result.minor}`);
      } else {
        console.log(formatSiteResults(result));

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
        spinner.fail('Site scan failed');
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`\nError: ${message}`));
      if (!isQuiet) {
        console.error(chalk.dim('\nMake sure the AllyLab API is running on ' + config.apiUrl));
      }
      process.exit(1);
    }
  });
