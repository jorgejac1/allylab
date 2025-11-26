import type { Finding, IssuePattern, Severity } from '../types';

export function analyzePatterns(findings: Finding[]): IssuePattern[] {
  const patternMap = new Map<string, {
    ruleId: string;
    ruleTitle: string;
    severity: Severity;
    count: number;
    pages: Set<string>;
    selectors: Set<string>;
  }>();

  for (const finding of findings) {
    const existing = patternMap.get(finding.ruleId);
    if (existing) {
      existing.count++;
      if (finding.page) existing.pages.add(finding.page);
      existing.selectors.add(finding.selector);
    } else {
      patternMap.set(finding.ruleId, {
        ruleId: finding.ruleId,
        ruleTitle: finding.ruleTitle,
        severity: finding.impact,
        count: 1,
        pages: new Set(finding.page ? [finding.page] : []),
        selectors: new Set([finding.selector]),
      });
    }
  }

  return Array.from(patternMap.values())
    .map(p => ({
      ruleId: p.ruleId,
      ruleTitle: p.ruleTitle,
      severity: p.severity,
      count: p.count,
      pages: p.pages.size || 1,
      type: determineType(p.count, p.pages.size, p.selectors.size),
      fixStrategy: getFixStrategy(p.count, p.pages.size),
    }))
    .sort((a, b) => b.count - a.count);
}

function determineType(count: number, pages: number, selectors: number): IssuePattern['type'] {
  if (selectors <= 3 && count > 10) return 'template';
  if (pages <= 1) return 'page-specific';
  return 'global';
}

function getFixStrategy(count: number, pages: number): string {
  if (pages <= 2 && count > 10) {
    return `Fix ${pages} template${pages > 1 ? 's' : ''}`;
  }
  if (pages === 1) {
    return 'Fix on page';
  }
  return `Fix across ${pages} pages`;
}

export function calculateEfficiencyGain(patterns: IssuePattern[]): number {
  const totalIssues = patterns.reduce((sum, p) => sum + p.count, 0);
  const uniquePatterns = patterns.length;
  
  if (totalIssues === 0) return 0;
  return Math.round(((totalIssues - uniquePatterns) / totalIssues) * 100);
}