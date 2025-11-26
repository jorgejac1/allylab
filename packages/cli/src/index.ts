#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand } from './commands/scan.js';
import { siteCommand } from './commands/site.js';

const program = new Command();

program
  .name('allylab')
  .description('AllyLab CLI - Accessibility scanning from the command line')
  .version('1.0.0');

// Register commands
program.addCommand(scanCommand);
program.addCommand(siteCommand);

// Parse arguments
program.parse();