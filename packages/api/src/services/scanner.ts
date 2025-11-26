import AxeBuilder from '@axe-core/playwright';
import { createPage } from './browser.js';
import { calculateScore } from '../utils/scoring.js';
import { getWcagTags } from '../utils/wcag.js';
import type { Finding, ScanResult, Severity, Viewport } from '../types/index.js';

interface ScanOptions {
  url: string;
  standard?: string;
  viewport?: Viewport;
  includeWarnings?: boolean;
  onProgress?: (progress: { percent: number; message: string }) => void;
  onFinding?: (finding: Finding) => void;
}

export async function runScan(options: ScanOptions): Promise<ScanResult> {
  const { 
    url, 
    standard = 'wcag21aa', 
    viewport = 'desktop',
    includeWarnings = false, 
    onProgress, 
    onFinding 
  } = options;
  
  const startTime = Date.now();
  const viewportLabel = viewport === 'desktop' ? '🖥️ Desktop' : viewport === 'tablet' ? '📱 Tablet' : '📲 Mobile';

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

    onProgress?.({ percent: 70, message: 'Processing results...' });

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
        };

        findings.push(finding);
        onFinding?.(finding);
      }
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
    };

    onProgress?.({ percent: 100, message: 'Scan complete!' });

    return result;
  } finally {
    await page.close();
  }
}