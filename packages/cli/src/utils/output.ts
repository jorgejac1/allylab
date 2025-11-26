import chalk from 'chalk';
import type { ScanResult, SiteScanResult, PageResult } from './api.js';

export function formatScore(score: number): string {
  let color: typeof chalk.green;
  let label: string;
  
  if (score >= 90) {
    color = chalk.green;
    label = 'Excellent';
  } else if (score >= 70) {
    color = chalk.yellow;
    label = 'Good';
  } else if (score >= 50) {
    color = chalk.hex('#f97316'); // orange
    label = 'Needs Work';
  } else {
    color = chalk.red;
    label = 'Poor';
  }
  
  return color.bold(`${score}/100`) + chalk.dim(` (${label})`);
}

export function formatResults(result: ScanResult): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold('📊 Results'));
  lines.push('');
  lines.push(`  Score:     ${formatScore(result.score)}`);
  lines.push('');
  lines.push('  Issues Found:');
  lines.push(`    ${chalk.red('🔴 Critical:')}   ${result.critical}`);
  lines.push(`    ${chalk.hex('#f97316')('🟠 Serious:')}    ${result.serious}`);
  lines.push(`    ${chalk.yellow('🟡 Moderate:')}   ${result.moderate}`);
  lines.push(`    ${chalk.blue('🔵 Minor:')}      ${result.minor}`);
  lines.push(`    ${chalk.dim('─'.repeat(20))}`);
  lines.push(`    ${chalk.bold('Total:')}        ${result.totalIssues}`);
  lines.push('');
  lines.push(chalk.dim('━'.repeat(50)));
  
  // Top issues by severity
  if (result.findings && result.findings.length > 0) {
    lines.push('');
    lines.push(chalk.bold('🔍 Top Issues'));
    lines.push('');
    
    const criticalIssues = result.findings
      .filter(f => f.impact === 'critical')
      .slice(0, 5);
    
    const seriousIssues = result.findings
      .filter(f => f.impact === 'serious')
      .slice(0, 5);
    
    const topIssues = [...criticalIssues, ...seriousIssues].slice(0, 5);
    
    for (const issue of topIssues) {
      const severityColor = issue.impact === 'critical' ? chalk.red : chalk.hex('#f97316');
      lines.push(`  ${severityColor('●')} ${issue.ruleTitle}`);
      lines.push(chalk.dim(`    ${issue.selector.slice(0, 60)}${issue.selector.length > 60 ? '...' : ''}`));
    }
    
    if (result.totalIssues > 5) {
      lines.push('');
      lines.push(chalk.dim(`  ... and ${result.totalIssues - 5} more issues`));
    }
  }
  
  lines.push('');
  lines.push(chalk.dim(`Scan completed in ${(result.scanTime / 1000).toFixed(1)}s`));
  
  return lines.join('\n');
}

export function formatSiteResults(result: SiteScanResult): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold('📊 Site Scan Results'));
  lines.push('');
  lines.push(`  Average Score: ${formatScore(result.averageScore)}`);
  lines.push(`  Pages Scanned: ${chalk.cyan(result.pagesScanned)}`);
  lines.push('');
  lines.push('  Total Issues:');
  lines.push(`    ${chalk.red('🔴 Critical:')}   ${result.critical}`);
  lines.push(`    ${chalk.hex('#f97316')('🟠 Serious:')}    ${result.serious}`);
  lines.push(`    ${chalk.yellow('🟡 Moderate:')}   ${result.moderate}`);
  lines.push(`    ${chalk.blue('🔵 Minor:')}      ${result.minor}`);
  lines.push(`    ${chalk.dim('─'.repeat(20))}`);
  lines.push(`    ${chalk.bold('Total:')}        ${result.totalIssues}`);
  lines.push('');
  lines.push(chalk.dim('━'.repeat(50)));
  lines.push('');
  lines.push(chalk.bold('📄 Page-by-Page Results'));
  lines.push('');
  
  // Sort by score (worst first)
  const sortedResults: PageResult[] = [...result.results].sort((a, b) => a.score - b.score);
  
  // Table header
  lines.push(chalk.dim('  Page                              Score   Critical'));
  lines.push(chalk.dim('  ' + '─'.repeat(55)));
  
  for (const page of sortedResults) {
    const path = new URL(page.url).pathname || '/';
    const truncatedPath = path.length > 30 ? path.slice(0, 27) + '...' : path.padEnd(30);
    const scoreStr = formatScoreCompact(page.score);
    const criticalStr = page.critical > 0 ? chalk.red(page.critical.toString()) : chalk.dim('0');
    
    lines.push(`  ${truncatedPath}  ${scoreStr}      ${criticalStr}`);
  }
  
  lines.push('');
  
  return lines.join('\n');
}

function formatScoreCompact(score: number): string {
  const scoreStr = score.toString().padStart(3);
  
  if (score >= 90) return chalk.green(scoreStr);
  if (score >= 70) return chalk.yellow(scoreStr);
  if (score >= 50) return chalk.hex('#f97316')(scoreStr);
  return chalk.red(scoreStr);
}

export function formatError(message: string): string {
  return chalk.red(`\n❌ Error: ${message}\n`);
}