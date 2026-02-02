import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, existsSync } from 'fs';
import { fetchScan, type ScanResult } from '../utils/api.js';
import { formatScore } from '../utils/output.js';
import { formatSarif } from '../utils/sarif.js';
import { toHtml } from '../utils/html.js';
import { writeOutput } from '../utils/file.js';
import { loadConfig, getConfigPath } from '../utils/config.js';

interface BatchOptions {
  standard?: string;
  viewport?: string;
  failOn?: string;
  format?: string;
  output?: string;
  apiUrl?: string;
  timeout?: string;
  ignoreRules?: string;
  concurrency?: string;
  verbose?: boolean;
  quiet?: boolean;
}

interface BatchResult {
  url: string;
  success: boolean;
  result?: ScanResult;
  error?: string;
}

/**
 * Parse URL list from file or stdin
 */
function parseUrlList(input: string): string[] {
  const lines = input.split('\n');
  const urls: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    // Normalize URL
    let url = trimmed;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    urls.push(url);
  }

  return urls;
}

/**
 * Process URLs with concurrency limit
 */
async function processBatch(
  urls: string[],
  config: ReturnType<typeof loadConfig>,
  concurrency: number,
  onProgress: (completed: number, total: number, url: string, success: boolean) => void
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  let completed = 0;

  // Process in batches based on concurrency
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url): Promise<BatchResult> => {
        try {
          const result = await fetchScan(
            config.apiUrl,
            url,
            config.standard,
            config.viewport,
            config.timeout
          );
          completed++;
          onProgress(completed, urls.length, url, true);
          return { url, success: true, result };
        } catch (error) {
          completed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          onProgress(completed, urls.length, url, false);
          return { url, success: false, error: errorMessage };
        }
      })
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Generate combined report
 */
function generateCombinedReport(results: BatchResult[], format: string): string {
  const successfulResults = results.filter(r => r.success && r.result);

  if (format === 'json') {
    return JSON.stringify({
      summary: {
        total: results.length,
        successful: successfulResults.length,
        failed: results.length - successfulResults.length,
        averageScore: successfulResults.length > 0
          ? Math.round(successfulResults.reduce((sum, r) => sum + (r.result?.score || 0), 0) / successfulResults.length)
          : 0,
        totalIssues: successfulResults.reduce((sum, r) => sum + (r.result?.totalIssues || 0), 0),
        critical: successfulResults.reduce((sum, r) => sum + (r.result?.critical || 0), 0),
        serious: successfulResults.reduce((sum, r) => sum + (r.result?.serious || 0), 0),
        moderate: successfulResults.reduce((sum, r) => sum + (r.result?.moderate || 0), 0),
        minor: successfulResults.reduce((sum, r) => sum + (r.result?.minor || 0), 0),
      },
      results: results.map(r => ({
        url: r.url,
        success: r.success,
        score: r.result?.score,
        totalIssues: r.result?.totalIssues,
        critical: r.result?.critical,
        serious: r.result?.serious,
        moderate: r.result?.moderate,
        minor: r.result?.minor,
        error: r.error,
      })),
    }, null, 2);
  }

  if (format === 'sarif') {
    // Combine all findings into a single SARIF log
    const combinedFindings = successfulResults.flatMap(r => r.result?.findings || []);
    const combinedResult: ScanResult = {
      url: 'batch-scan',
      timestamp: new Date().toISOString(),
      score: successfulResults.length > 0
        ? Math.round(successfulResults.reduce((sum, r) => sum + (r.result?.score || 0), 0) / successfulResults.length)
        : 0,
      totalIssues: combinedFindings.length,
      critical: successfulResults.reduce((sum, r) => sum + (r.result?.critical || 0), 0),
      serious: successfulResults.reduce((sum, r) => sum + (r.result?.serious || 0), 0),
      moderate: successfulResults.reduce((sum, r) => sum + (r.result?.moderate || 0), 0),
      minor: successfulResults.reduce((sum, r) => sum + (r.result?.minor || 0), 0),
      scanTime: 0,
      findings: combinedFindings,
    };
    return formatSarif(combinedResult);
  }

  if (format === 'html') {
    // Generate HTML report for each successful result
    const htmlParts = successfulResults.map(r => {
      if (!r.result) return '';
      return toHtml(r.result);
    });
    // For batch, just return the first one or combine
    if (htmlParts.length === 1) {
      return htmlParts[0];
    }
    // Generate a combined HTML report
    return generateBatchHtmlReport(results);
  }

  // Pretty format - return summary
  const lines: string[] = [];
  lines.push(chalk.bold('\nBatch Scan Summary'));
  lines.push(chalk.dim('━'.repeat(50)));
  lines.push(`Total URLs: ${results.length}`);
  lines.push(`Successful: ${chalk.green(successfulResults.length.toString())}`);
  lines.push(`Failed: ${chalk.red((results.length - successfulResults.length).toString())}`);

  if (successfulResults.length > 0) {
    const avgScore = Math.round(
      successfulResults.reduce((sum, r) => sum + (r.result?.score || 0), 0) / successfulResults.length
    );
    lines.push(`Average Score: ${formatScore(avgScore)}`);
    lines.push(`Total Issues: ${successfulResults.reduce((sum, r) => sum + (r.result?.totalIssues || 0), 0)}`);
  }

  lines.push(chalk.dim('━'.repeat(50)));
  lines.push(chalk.bold('\nResults by URL:'));

  for (const r of results) {
    if (r.success && r.result) {
      const scoreColor = r.result.score >= 90 ? 'green' : r.result.score >= 70 ? 'yellow' : 'red';
      lines.push(`  ${chalk[scoreColor]('✓')} ${r.url} - Score: ${r.result.score}, Issues: ${r.result.totalIssues}`);
    } else {
      lines.push(`  ${chalk.red('✗')} ${r.url} - ${r.error}`);
    }
  }

  return lines.join('\n');
}

function generateBatchHtmlReport(results: BatchResult[]): string {
  const successfulResults = results.filter(r => r.success && r.result);
  const avgScore = successfulResults.length > 0
    ? Math.round(successfulResults.reduce((sum, r) => sum + (r.result?.score || 0), 0) / successfulResults.length)
    : 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Batch Accessibility Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background: #f3f4f6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    h1 { text-align: center; margin-bottom: 2rem; }
    .summary { background: white; border-radius: 12px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }
    .stat { text-align: center; }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .stat-label { font-size: 0.875rem; color: #6b7280; }
    .results { margin-top: 2rem; }
    .result-card { background: white; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; }
    .result-url { color: #2563eb; word-break: break-all; }
    .result-score { font-size: 1.5rem; font-weight: bold; }
    .result-issues { color: #6b7280; font-size: 0.875rem; }
    .success { border-left: 4px solid #22c55e; }
    .failed { border-left: 4px solid #ef4444; }
    .error { color: #ef4444; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Batch Accessibility Report</h1>
    <div class="summary">
      <div class="stat">
        <div class="stat-value">${results.length}</div>
        <div class="stat-label">Total URLs</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #22c55e">${successfulResults.length}</div>
        <div class="stat-label">Successful</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #ef4444">${results.length - successfulResults.length}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat">
        <div class="stat-value">${avgScore}</div>
        <div class="stat-label">Avg Score</div>
      </div>
    </div>
    <div class="results">
      ${results.map(r => `
        <div class="result-card ${r.success ? 'success' : 'failed'}">
          <div>
            <a href="${r.url}" class="result-url" target="_blank">${r.url}</a>
            ${r.error ? `<div class="error">${r.error}</div>` : ''}
          </div>
          ${r.success && r.result ? `
            <div style="text-align: right">
              <div class="result-score">${r.result.score}</div>
              <div class="result-issues">${r.result.totalIssues} issues</div>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
}

export const batchCommand = new Command('batch')
  .description('Scan multiple URLs from a file or stdin')
  .argument('[file]', 'File containing URLs (one per line), or use stdin')
  .option('-s, --standard <standard>', 'WCAG standard')
  .option('-v, --viewport <viewport>', 'Viewport size')
  .option('-f, --fail-on <severity>', 'Exit with code 1 if issues of this severity or higher are found')
  .option('--format <format>', 'Output format (pretty, json, sarif, html)')
  .option('-o, --output <file>', 'Write results to file')
  .option('--api-url <url>', 'API server URL')
  .option('--timeout <ms>', 'Request timeout in milliseconds')
  .option('--ignore-rules <rules>', 'Comma-separated list of rule IDs to ignore')
  .option('-c, --concurrency <number>', 'Number of concurrent scans', '3')
  .option('--verbose', 'Show detailed output')
  .option('-q, --quiet', 'Minimal output')
  .action(async (file: string | undefined, options: BatchOptions) => {
    // Load config
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

    const concurrency = parseInt(options.concurrency || '3', 10);
    const isQuiet = options.quiet || config.format === 'json' || config.format === 'sarif';

    // Get URLs from file or stdin
    let urlContent: string;
    if (file) {
      if (!existsSync(file)) {
        console.error(chalk.red(`Error: File not found: ${file}`));
        process.exit(2);
        return;
      }
      urlContent = readFileSync(file, 'utf-8');
    } else if (!process.stdin.isTTY) {
      // Read from stdin
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      urlContent = Buffer.concat(chunks).toString('utf-8');
    } else {
      console.error(chalk.red('Error: No URL file provided and no stdin input'));
      console.log('Usage: allylab batch <file> or cat urls.txt | allylab batch');
      process.exit(2);
      return;
    }

    const urls = parseUrlList(urlContent);

    if (urls.length === 0) {
      console.error(chalk.red('Error: No valid URLs found'));
      process.exit(2);
      return;
    }

    if (!isQuiet) {
      console.log();
      console.log(chalk.bold.blue('📋 AllyLab - Batch Scanner'));
      console.log();
      console.log(`  URLs:        ${chalk.cyan(urls.length.toString())}`);
      console.log(`  Concurrency: ${chalk.yellow(concurrency.toString())}`);
      console.log(`  Standard:    ${chalk.yellow(config.standard.toUpperCase())}`);

      if (options.verbose) {
        const configPath = getConfigPath();
        if (configPath) {
          console.log(`  Config:      ${chalk.dim(configPath)}`);
        }
      }

      console.log();
      console.log(chalk.dim('━'.repeat(50)));
      console.log();
    }

    const spinner = isQuiet ? null : ora(`Scanning 0/${urls.length} URLs...`).start();

    const results = await processBatch(urls, config, concurrency, (completed, total, url, success) => {
      if (spinner) {
        const status = success ? chalk.green('✓') : chalk.red('✗');
        spinner.text = `Scanning ${completed}/${total}: ${status} ${new URL(url).hostname}`;
      }
    });

    if (spinner) {
      const successCount = results.filter(r => r.success).length;
      spinner.succeed(`Completed ${successCount}/${urls.length} scans`);
      console.log();
    }

    // Generate report
    const report = generateCombinedReport(results, config.format);

    if (config.output) {
      writeOutput(config.output, report);
      if (!isQuiet) {
        console.log(chalk.green(`✓ Results written to ${config.output}`));
      }
    } else {
      console.log(report);
    }

    // Check fail threshold
    if (config.failOn) {
      const severityLevels = ['minor', 'moderate', 'serious', 'critical'];
      const thresholdIndex = severityLevels.indexOf(config.failOn);

      if (thresholdIndex === -1) {
        console.error(chalk.red(`\nInvalid severity: ${config.failOn}`));
        process.exit(2);
        return;
      }

      let failCount = 0;
      for (const r of results) {
        if (!r.success || !r.result) continue;
        if (thresholdIndex <= 3) failCount += r.result.critical;
        if (thresholdIndex <= 2) failCount += r.result.serious;
        if (thresholdIndex <= 1) failCount += r.result.moderate;
        if (thresholdIndex <= 0) failCount += r.result.minor;
      }

      if (failCount > 0) {
        if (!isQuiet) {
          console.log();
          console.log(chalk.red.bold(`❌ Batch scan failed: ${failCount} ${config.failOn}+ issues found`));
        }
        process.exit(1);
      }
    }
  });
