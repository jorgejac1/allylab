#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { scanCommand } from './commands/scan.js';
import { siteCommand } from './commands/site.js';
import { initCommand } from './commands/init.js';
import { batchCommand } from './commands/batch.js';
import { watchCommand } from './commands/watch.js';
import { getConfigPath } from './utils/config.js';

const VERSION = '1.1.0';

const program = new Command();

program
  .name('allylab')
  .description('AllyLab CLI - Accessibility scanning from the command line')
  .version(VERSION, '-V, --version', 'Output the version number')
  .addHelpText('after', `
Environment Variables:
  ALLYLAB_API_URL         API server URL (default: http://localhost:3001)
  ALLYLAB_STANDARD        WCAG standard (default: wcag21aa)
  ALLYLAB_VIEWPORT        Viewport size (default: desktop)
  ALLYLAB_FAIL_ON         Severity threshold for exit code 1
  ALLYLAB_FORMAT          Output format (default: pretty)
  ALLYLAB_TIMEOUT         Request timeout in ms (default: 60000)
  ALLYLAB_IGNORE_RULES    Comma-separated rule IDs to ignore
  ALLYLAB_MAX_PAGES       Max pages for site scan (default: 10)
  ALLYLAB_MAX_DEPTH       Max crawl depth (default: 2)

Config Files:
  .allylabrc.json, .allylabrc, allylab.config.json

Examples:
  $ allylab scan https://example.com
  $ allylab scan example.com --standard wcag22aa --fail-on critical
  $ allylab site https://example.com --max-pages 20
  $ allylab scan https://example.com --format sarif -o results.sarif
  $ allylab scan https://example.com --format html -o report.html
  $ allylab batch urls.txt -o results.json
  $ allylab watch https://example.com --interval 30
  $ allylab init github-actions
`);

// Register commands
program.addCommand(scanCommand);
program.addCommand(siteCommand);
program.addCommand(initCommand);
program.addCommand(batchCommand);
program.addCommand(watchCommand);

// Add info command
program
  .command('info')
  .description('Show CLI configuration and environment info')
  .action(() => {
    console.log();
    console.log(chalk.bold.blue('AllyLab CLI'));
    console.log();
    console.log(`  Version:  ${chalk.cyan(VERSION)}`);
    console.log(`  Node.js:  ${chalk.cyan(process.version)}`);
    console.log(`  Platform: ${chalk.cyan(process.platform)}`);

    const configPath = getConfigPath();
    if (configPath) {
      console.log(`  Config:   ${chalk.green(configPath)}`);
    } else {
      console.log(`  Config:   ${chalk.dim('(none found)')}`);
    }

    console.log();
    console.log(chalk.bold('Environment:'));

    const envVars = [
      'ALLYLAB_API_URL',
      'ALLYLAB_STANDARD',
      'ALLYLAB_VIEWPORT',
      'ALLYLAB_FAIL_ON',
      'ALLYLAB_FORMAT',
      'ALLYLAB_TIMEOUT',
      'ALLYLAB_IGNORE_RULES',
      'ALLYLAB_MAX_PAGES',
      'ALLYLAB_MAX_DEPTH',
    ];

    for (const key of envVars) {
      const value = process.env[key];
      if (value) {
        console.log(`  ${key}: ${chalk.cyan(value)}`);
      }
    }

    const hasEnvVars = envVars.some(key => process.env[key]);
    if (!hasEnvVars) {
      console.log(chalk.dim('  (no environment variables set)'));
    }

    console.log();
  });

// Parse arguments
program.parse();
