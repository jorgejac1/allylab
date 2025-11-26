import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { fetchScan } from '../utils/api.js';
import { formatResults, formatScore } from '../utils/output.js';
import { writeOutput } from '../utils/file.js';

interface ScanOptions {
  standard: string;
  viewport: string;
  failOn?: string;
  format: string;
  output?: string;
  apiUrl: string;
}

export const scanCommand = new Command('scan')
  .description('Scan a single page for accessibility issues')
  .argument('<url>', 'URL to scan')
  .option('-s, --standard <standard>', 'WCAG standard (wcag21aa, wcag22aa, wcag21a, wcag2aa, wcag2a)', 'wcag21aa')
  .option('-v, --viewport <viewport>', 'Viewport size (desktop, tablet, mobile)', 'desktop')
  .option('-f, --fail-on <severity>', 'Exit with code 1 if issues of this severity or higher are found (critical, serious, moderate, minor)')
  .option('--format <format>', 'Output format (pretty, json, summary)', 'pretty')
  .option('-o, --output <file>', 'Write results to file')
  .option('--api-url <url>', 'API server URL', 'http://localhost:3001')
  .action(async (url: string, options: ScanOptions) => {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    console.log();
    console.log(chalk.bold.blue('🔍 AllyLab - Accessibility Scanner'));
    console.log();
    console.log(`  URL:      ${chalk.cyan(url)}`);
    console.log(`  Standard: ${chalk.yellow(options.standard.toUpperCase())}`);
    console.log(`  Viewport: ${chalk.yellow(options.viewport)}`);
    console.log();
    console.log(chalk.dim('━'.repeat(50)));
    console.log();

    const spinner = ora('Scanning page...').start();

    try {
      const result = await fetchScan(options.apiUrl, url, options.standard, options.viewport);
      
      spinner.succeed('Scan complete!');
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
        console.log(formatScore(result.score));
        console.log(`Total Issues: ${result.totalIssues}`);
        console.log(`Critical: ${result.critical} | Serious: ${result.serious} | Moderate: ${result.moderate} | Minor: ${result.minor}`);
      } else {
        console.log(formatResults(result));
        
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
          console.error('Valid values: critical, serious, moderate, minor');
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
      spinner.fail('Scan failed');
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`\nError: ${message}`));
      console.error(chalk.dim('\nMake sure the AllyLab API is running on ' + options.apiUrl));
      process.exit(1);
    }
  });