import AxeBuilder from '@axe-core/playwright';
import { createPage } from './browser.js';
import { calculateScore } from '../utils/scoring.js';
import { getWcagTags } from '../utils/wcag.js';
import { evaluateCustomRules, getEnabledRulesCount } from './rule-evaluator.js';
import type { Finding, ScanResult, Severity, Viewport } from '../types/index.js';
import type { RuleViolation } from '../types/rules.js';

interface ScanOptions {
  url: string;
  standard?: string;
  viewport?: Viewport;
  includeWarnings?: boolean;
  includeCustomRules?: boolean;
  onProgress?: (progress: { percent: number; message: string }) => void;
  onFinding?: (finding: Finding) => void;
}

export async function runScan(options: ScanOptions): Promise<ScanResult> {
  const { 
    url, 
    standard = 'wcag21aa', 
    viewport = 'desktop',
    includeWarnings = false,
    includeCustomRules = true,
    onProgress, 
    onFinding 
  } = options;
  
  const startTime = Date.now();
  const viewportLabel = viewport === 'desktop' ? '🖥️ Desktop' : viewport === 'tablet' ? '📱 Tablet' : '📲 Mobile';
  const customRulesCount = includeCustomRules ? getEnabledRulesCount() : 0;

  const page = await createPage(viewport);

  try {
    onProgress?.({ percent: 10, message: `Navigating to page (${viewportLabel})...` });

    // Use domcontentloaded instead of networkidle
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
    } catch (navError) {
      if (navError instanceof Error && navError.message.includes('Timeout')) {
        onProgress?.({ percent: 15, message: 'Page loading slowly, continuing scan...' });
        await page.goto(url, {
          waitUntil: 'commit',
          timeout: 30000,
        });
      } else {
        throw navError;
      }
    }

    // Wait a bit for JavaScript to render content
    onProgress?.({ percent: 30, message: 'Waiting for page to render...' });
    await page.waitForTimeout(2000);

    onProgress?.({ percent: 40, message: `Running accessibility scan (${viewportLabel})...` });

    // Run axe-core
    const axeBuilder = new AxeBuilder({ page })
      .withTags(getWcagTags(standard));

    const results = await axeBuilder.analyze();

    onProgress?.({ percent: 60, message: 'Processing axe-core results...' });

    // Process violations into findings
    const findings: Finding[] = [];
    const severityCounts = { critical: 0, serious: 0, moderate: 0, minor: 0 };

    const violations = includeWarnings 
      ? [...results.violations, ...results.incomplete]
      : results.violations;

    for (const violation of violations) {
      const severity = (violation.impact as Severity) || 'minor';
      severityCounts[severity]++;

      for (const node of violation.nodes) {
        const finding: Finding = {
          id: `${violation.id}-${findings.length}`,
          ruleId: violation.id,
          ruleTitle: violation.help,
          description: violation.description,
          impact: severity,
          selector: node.target.join(' '),
          html: node.html,
          helpUrl: violation.helpUrl,
          wcagTags: violation.tags.filter((t: string) => t.startsWith('wcag')),
          source: 'axe-core',
        };

        findings.push(finding);
        onFinding?.(finding);
      }
    }

    // Run custom rules if enabled
    if (includeCustomRules && customRulesCount > 0) {
      onProgress?.({ percent: 75, message: `Running ${customRulesCount} custom rules...` });

      const customViolations = await evaluateCustomRules({
        page,
        onViolation: (violation) => {
          const finding = ruleViolationToFinding(violation, findings.length);
          findings.push(finding);
          severityCounts[violation.severity]++;
          onFinding?.(finding);
        },
      });

      onProgress?.({ 
        percent: 85, 
        message: `Custom rules found ${customViolations.length} issues` 
      });
    }

    onProgress?.({ percent: 90, message: 'Calculating score...' });

    const score = calculateScore(severityCounts);
    const scanDuration = Date.now() - startTime;

    const result: ScanResult = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      url,
      timestamp: new Date().toISOString(),
      score,
      totalIssues: findings.length,
      ...severityCounts,
      findings,
      scanDuration,
      viewport,
      customRulesCount,
    };

    onProgress?.({ percent: 100, message: 'Scan complete!' });

    return result;
  } finally {
    await page.close();
  }
}

/**
 * Convert a RuleViolation to a Finding
 */
function ruleViolationToFinding(violation: RuleViolation, index: number): Finding {
  return {
    id: `custom-${violation.ruleId}-${index}`,
    ruleId: violation.ruleId,
    ruleTitle: violation.ruleName,
    description: violation.message,
    impact: violation.severity,
    selector: violation.selector,
    html: violation.html,
    helpUrl: undefined,
    wcagTags: violation.wcagTags,
    source: 'custom-rule',
  };
}