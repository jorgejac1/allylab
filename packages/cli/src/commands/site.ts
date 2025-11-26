import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { fetchSiteScan } from '../utils/api.js';
import { formatSiteResults, formatScore } from '../utils/output.js';
import { writeOutput } from '../utils/file.js';

interface SiteOptions {
  maxPages: number;
  maxDepth: number;
  standard: string;
  failOn?: string;
  format: string;
  output?: string;
  apiUrl: string;
}

export const siteCommand = new Command('site')
  .description('Crawl and scan multiple pages across a website')
  .argument('<url>', 'Website URL to scan')
  .option('-p, --max-pages <number>', 'Maximum pages to scan', '10')
  .option('-d, --max-depth <number>', 'Maximum crawl depth', '2')
  .option('-s, --standard <standard>', 'WCAG standard', 'wcag21aa')
  .option('-f, --fail-on <severity>', 'Exit with code 1 if issues of this severity or higher are found')
  .option('--format <format>', 'Output format (pretty, json, summary)', 'pretty')
  .option('-o, --output <file>', 'Write results to file')
  .option('--api-url <url>', 'API server URL', 'http://localhost:3001')
  .action(async (url: string, options: SiteOptions) => {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const maxPages = parseInt(String(options.maxPages), 10);
    const maxDepth = parseInt(String(options.maxDepth), 10);

    console.log();
    console.log(chalk.bold.blue('🌐 AllyLab - Site Scanner'));
    console.log();
    console.log(`  URL:       ${chalk.cyan(url)}`);
    console.log(`  Max Pages: ${chalk.yellow(maxPages)}`);
    console.log(`  Max Depth: ${chalk.yellow(maxDepth)}`);
    console.log(`  Standard:  ${chalk.yellow(options.standard.toUpperCase())}`);
    console.log();
    console.log(chalk.dim('━'.repeat(50)));
    console.log();

    const spinner = ora('Discovering pages...').start();

    try {
      const result = await fetchSiteScan(
        options.apiUrl,
        url,
        maxPages,
        maxDepth,
        options.standard,
        (event) => {
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
      
      spinner.succeed(`Scanned ${result.pagesScanned} pages`);
      console.log();

      // Output results
      if (options.format === 'json') {
        const jsonOutput = JSON.stringify(result, null, 2);
        if (options.output) {
          writeOutput(options.output, jsonOutput);
          console.log(chalk.green(`✓ Results written to ${options.output}`));
        } else {
          console.log(jsonOutput);
        }
      } else if (options.format === 'summary') {
        console.log(formatScore(result.averageScore));
        console.log(`Pages Scanned: ${result.pagesScanned}`);
        console.log(`Total Issues: ${result.totalIssues}`);
        console.log(`Critical: ${result.critical} | Serious: ${result.serious} | Moderate: ${result.moderate} | Minor: ${result.minor}`);
      } else {
        console.log(formatSiteResults(result));
        
        if (options.output) {
          writeOutput(options.output, JSON.stringify(result, null, 2));
          console.log(chalk.green(`\n✓ Results written to ${options.output}`));
        }
      }

      // Check fail threshold
      if (options.failOn) {
        const severityLevels = ['minor', 'moderate', 'serious', 'critical'];
        const thresholdIndex = severityLevels.indexOf(options.failOn);
        
        if (thresholdIndex === -1) {
          console.error(chalk.red(`\nInvalid severity: ${options.failOn}`));
          process.exit(2);
        }

        let failCount = 0;
        if (thresholdIndex <= 3) failCount += result.critical;
        if (thresholdIndex <= 2) failCount += result.serious;
        if (thresholdIndex <= 1) failCount += result.moderate;
        if (thresholdIndex <= 0) failCount += result.minor;

        if (failCount > 0) {
          console.log();
          console.log(chalk.red.bold(`❌ Scan failed: ${failCount} ${options.failOn}+ issues found`));
          process.exit(1);
        } else {
          console.log();
          console.log(chalk.green.bold(`✓ Scan passed: No ${options.failOn}+ issues found`));
        }
      }

    } catch (error) {
      spinner.fail('Site scan failed');
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`\nError: ${message}`));
      console.error(chalk.dim('\nMake sure the AllyLab API is running on ' + options.apiUrl));
      process.exit(1);
    }
  });