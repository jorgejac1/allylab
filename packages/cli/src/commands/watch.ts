import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { fetchScan, type ScanResult } from '../utils/api.js';
import { formatScore } from '../utils/output.js';
import { loadConfig, getConfigPath } from '../utils/config.js';

interface WatchOptions {
  interval?: string;
  standard?: string;
  viewport?: string;
  failOn?: string;
  apiUrl?: string;
  timeout?: string;
  ignoreRules?: string;
  verbose?: boolean;
  onChange?: boolean;
}

interface WatchState {
  lastScore: number | null;
  lastIssueCount: number | null;
  scanCount: number;
  lastResult: ScanResult | null;
}

/**
 * Compare two scan results to detect changes
 */
function hasChanges(prev: ScanResult | null, current: ScanResult): boolean {
  if (!prev) return true;
  return (
    prev.score !== current.score ||
    prev.totalIssues !== current.totalIssues ||
    prev.critical !== current.critical ||
    prev.serious !== current.serious
  );
}

/**
 * Format change indicator
 */
function formatChange(prev: number | null, current: number, higherIsBetter: boolean): string {
  if (prev === null) return '';
  const diff = current - prev;
  if (diff === 0) return chalk.dim(' (no change)');
  const arrow = diff > 0 ? '↑' : '↓';
  const color = (diff > 0) === higherIsBetter ? 'green' : 'red';
  return chalk[color](` ${arrow} ${Math.abs(diff)}`);
}

export const watchCommand = new Command('watch')
  .description('Continuously scan a URL at regular intervals')
  .argument('<url>', 'URL to scan')
  .option('-i, --interval <seconds>', 'Scan interval in seconds', '60')
  .option('-s, --standard <standard>', 'WCAG standard')
  .option('-v, --viewport <viewport>', 'Viewport size')
  .option('-f, --fail-on <severity>', 'Exit with code 1 if issues of this severity or higher are found')
  .option('--api-url <url>', 'API server URL')
  .option('--timeout <ms>', 'Request timeout in milliseconds')
  .option('--ignore-rules <rules>', 'Comma-separated list of rule IDs to ignore')
  .option('--verbose', 'Show detailed output')
  .option('--on-change', 'Only show output when results change')
  .action(async (url: string, options: WatchOptions) => {
    // Load config
    const config = loadConfig({
      standard: options.standard,
      viewport: options.viewport,
      failOn: options.failOn,
      apiUrl: options.apiUrl,
      timeout: options.timeout ? parseInt(options.timeout, 10) : undefined,
      ignoreRules: options.ignoreRules?.split(',').map(r => r.trim()),
    });

    const interval = parseInt(options.interval || '60', 10) * 1000;

    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    console.log();
    console.log(chalk.bold.blue('👁️  AllyLab - Watch Mode'));
    console.log();
    console.log(`  URL:      ${chalk.cyan(url)}`);
    console.log(`  Interval: ${chalk.yellow(`${options.interval || 60}s`)}`);
    console.log(`  Standard: ${chalk.yellow(config.standard.toUpperCase())}`);
    console.log(`  Viewport: ${chalk.yellow(config.viewport)}`);

    if (options.verbose) {
      const configPath = getConfigPath();
      if (configPath) {
        console.log(`  Config:   ${chalk.dim(configPath)}`);
      }
    }

    console.log();
    console.log(chalk.dim('━'.repeat(50)));
    console.log(chalk.dim('Press Ctrl+C to stop'));
    console.log(chalk.dim('━'.repeat(50)));
    console.log();

    const state: WatchState = {
      lastScore: null,
      lastIssueCount: null,
      scanCount: 0,
      lastResult: null,
    };

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log();
      console.log(chalk.dim('━'.repeat(50)));
      console.log(chalk.bold('\nWatch Summary'));
      console.log(`  Total scans: ${state.scanCount}`);
      if (state.lastResult) {
        console.log(`  Final score: ${state.lastResult.score}`);
        console.log(`  Final issues: ${state.lastResult.totalIssues}`);
      }
      console.log();
      process.exit(0);
    });

    async function runScan(): Promise<void> {
      const spinner = ora('Scanning...').start();
      const timestamp = new Date().toLocaleTimeString();

      try {
        const result = await fetchScan(
          config.apiUrl,
          url,
          config.standard,
          config.viewport,
          config.timeout
        );

        state.scanCount++;
        const changed = hasChanges(state.lastResult, result);

        if (options.onChange && !changed && state.lastResult) {
          spinner.info(`[${timestamp}] No changes detected (Score: ${result.score})`);
        } else {
          spinner.succeed(`[${timestamp}] Scan #${state.scanCount} complete`);
          console.log();

          // Score with change indicator
          const scoreChange = formatChange(state.lastScore, result.score, true);
          console.log(`  Score: ${formatScore(result.score)}${scoreChange}`);

          // Issues with change indicator
          const issueChange = formatChange(state.lastIssueCount, result.totalIssues, false);
          console.log(`  Issues: ${result.totalIssues}${issueChange}`);

          // Breakdown
          console.log(`    ${chalk.red('●')} Critical: ${result.critical}`);
          console.log(`    ${chalk.hex('#ea580c')('●')} Serious: ${result.serious}`);
          console.log(`    ${chalk.yellow('●')} Moderate: ${result.moderate}`);
          console.log(`    ${chalk.blue('●')} Minor: ${result.minor}`);

          if (changed && state.lastResult) {
            console.log();
            console.log(chalk.bold('  Changes:'));
            if (result.score !== state.lastResult.score) {
              const scoreDiff = result.score - state.lastResult.score;
              const scoreColor = scoreDiff > 0 ? 'green' : 'red';
              console.log(`    Score: ${chalk[scoreColor](`${scoreDiff > 0 ? '+' : ''}${scoreDiff}`)}`);
            }
            if (result.critical !== state.lastResult.critical) {
              const diff = result.critical - state.lastResult.critical;
              console.log(`    Critical: ${diff > 0 ? chalk.red(`+${diff}`) : chalk.green(diff.toString())}`);
            }
            if (result.serious !== state.lastResult.serious) {
              const diff = result.serious - state.lastResult.serious;
              console.log(`    Serious: ${diff > 0 ? chalk.red(`+${diff}`) : chalk.green(diff.toString())}`);
            }
          }

          console.log();

          if (options.verbose && result.findings.length > 0) {
            console.log(chalk.dim('  Latest findings:'));
            for (const finding of result.findings.slice(0, 3)) {
              const impactColor = finding.impact === 'critical' ? 'red' :
                finding.impact === 'serious' ? 'hex' : 'yellow';
              const colorFn = impactColor === 'hex' ? chalk.hex('#ea580c') : chalk[impactColor];
              console.log(`    ${colorFn('●')} ${finding.ruleTitle}`);
            }
            if (result.findings.length > 3) {
              console.log(chalk.dim(`    ... and ${result.findings.length - 3} more`));
            }
            console.log();
          }
        }

        // Update state
        state.lastScore = result.score;
        state.lastIssueCount = result.totalIssues;
        state.lastResult = result;

        // Check fail threshold
        if (config.failOn) {
          const severityLevels = ['minor', 'moderate', 'serious', 'critical'];
          const thresholdIndex = severityLevels.indexOf(config.failOn);

          if (thresholdIndex !== -1) {
            let failCount = 0;
            if (thresholdIndex <= 3) failCount += result.critical;
            if (thresholdIndex <= 2) failCount += result.serious;
            if (thresholdIndex <= 1) failCount += result.moderate;
            if (thresholdIndex <= 0) failCount += result.minor;

            if (failCount > 0) {
              console.log(chalk.red.bold(`  ⚠️  Threshold exceeded: ${failCount} ${config.failOn}+ issues`));
              console.log();
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        spinner.fail(`[${timestamp}] Scan failed: ${message}`);
        console.log();
      }
    }

    // Run initial scan
    await runScan();

    // Schedule recurring scans
    setInterval(runScan, interval);

    // Keep process running
    await new Promise(() => {});
  });
