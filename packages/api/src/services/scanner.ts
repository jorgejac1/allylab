import AxeBuilder from '@axe-core/playwright';
import type { Page } from 'playwright';
import { createPage } from './browser.js';
import { calculateScore } from '../utils/scoring.js';
import { getWcagTags } from '../utils/wcag.js';
import { evaluateCustomRules, getEnabledRulesCount } from './rule-evaluator.js';
import type { Finding, ScanResult, Severity, Viewport } from '../types/index.js';
import type { RuleViolation } from '../types/rules.js';

// Browser globals for page.evaluate (these run in browser context, not Node.js)
declare const document: {
  querySelector(selector: string): { 
    style?: { 
      outline: string; 
      outlineOffset: string;
    };
  } | null;
};

interface ScanOptions {
  url: string;
  standard?: string;
  viewport?: Viewport;
  includeWarnings?: boolean;
  includeCustomRules?: boolean;
  captureScreenshots?: boolean;
  onProgress?: (progress: { percent: number; message: string }) => void;
  onFinding?: (finding: Finding) => void;
}

/**
 * Capture a screenshot of a specific element with highlight
 * Returns base64 encoded PNG or undefined if capture fails
 */
async function captureElementScreenshot(
  page: Page,
  selector: string,
  options: {
    highlightColor?: string;
    highlightWidth?: number;
    padding?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<string | undefined> {
  const {
    highlightColor = '#ef4444',
    highlightWidth = 3,
    padding = 16,
    maxWidth = 500,
    maxHeight = 300,
  } = options;

  try {
    // Try to find the element
    const element = await page.waitForSelector(selector, { 
      timeout: 2000,
      state: 'visible',
    }).catch(() => null);

    if (!element) {
      return undefined;
    }

    // Scroll element into view
    await element.scrollIntoViewIfNeeded().catch(() => {});

    // Add highlight overlay (runs in browser context)
    await page.evaluate(
      (args) => {
        const el = document.querySelector(args.sel);
        if (el?.style) {
          el.style.outline = `${args.width}px solid ${args.color}`;
          el.style.outlineOffset = '2px';
        }
      },
      { sel: selector, color: highlightColor, width: highlightWidth }
    );

    // Small delay for style to apply
    await page.waitForTimeout(50);

    // Get bounding box
    const box = await element.boundingBox();
    if (!box) {
      return undefined;
    }

    // Get viewport size to clamp values
    const viewport = page.viewportSize() || { width: 1280, height: 720 };

    // Calculate clip area with padding
    const clip = {
      x: Math.max(0, box.x - padding),
      y: Math.max(0, box.y - padding),
      width: Math.min(box.width + padding * 2, maxWidth, viewport.width),
      height: Math.min(box.height + padding * 2, maxHeight, viewport.height),
    };

    // Ensure we don't go off-screen
    if (clip.x + clip.width > viewport.width) {
      clip.width = viewport.width - clip.x;
    }
    if (clip.y + clip.height > viewport.height) {
      clip.height = viewport.height - clip.y;
    }

    // Ensure minimum dimensions
    if (clip.width < 10 || clip.height < 10) {
      return undefined;
    }

    // Capture screenshot
    const screenshot = await page.screenshot({ 
      clip, 
      type: 'png',
    });

    // Remove highlight
    await page.evaluate(
      (sel) => {
        const el = document.querySelector(sel);
        if (el?.style) {
          el.style.outline = '';
          el.style.outlineOffset = '';
        }
      },
      selector
    );

    return screenshot.toString('base64');
  } catch {
    // Silent fail - screenshots are optional
    return undefined;
  }
}

export async function runScan(options: ScanOptions): Promise<ScanResult> {
  const { 
    url, 
    standard = 'wcag21aa', 
    viewport = 'desktop',
    includeWarnings = false,
    includeCustomRules = true,
    captureScreenshots = true,
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

    onProgress?.({ percent: 55, message: 'Processing axe-core results...' });

    // Process violations into findings
    const findings: Finding[] = [];
    const severityCounts = { critical: 0, serious: 0, moderate: 0, minor: 0 };

    const violations = includeWarnings 
      ? [...results.violations, ...results.incomplete]
      : results.violations;

    // Calculate total nodes for progress
    const totalNodes = violations.reduce((sum, v) => sum + v.nodes.length, 0);
    let processedNodes = 0;

    for (const violation of violations) {
      const severity = (violation.impact as Severity) || 'minor';
      severityCounts[severity]++;

      for (const node of violation.nodes) {
        const selector = node.target.join(' ');
        
        // Capture element screenshot if enabled
        let screenshot: string | undefined;
        if (captureScreenshots) {
          screenshot = await captureElementScreenshot(page, selector);
        }

        const finding: Finding = {
          id: `${violation.id}-${findings.length}`,
          ruleId: violation.id,
          ruleTitle: violation.help,
          description: violation.description,
          impact: severity,
          selector,
          html: node.html,
          helpUrl: violation.helpUrl,
          wcagTags: violation.tags.filter((t: string) => t.startsWith('wcag')),
          source: 'axe-core',
          screenshot,
        };

        findings.push(finding);
        onFinding?.(finding);

        // Update progress
        processedNodes++;
        const screenshotProgress = 55 + Math.floor((processedNodes / totalNodes) * 15);
        onProgress?.({ 
          percent: Math.min(screenshotProgress, 70), 
          message: `Processing findings (${processedNodes}/${totalNodes})...` 
        });
      }
    }

    // Run custom rules if enabled
    if (includeCustomRules && customRulesCount > 0) {
      onProgress?.({ percent: 75, message: `Running ${customRulesCount} custom rules...` });

      const customViolations = await evaluateCustomRules({
        page,
        onViolation: async (violation) => {
          // Capture screenshot for custom rule violations too
          let screenshot: string | undefined;
          if (captureScreenshots) {
            screenshot = await captureElementScreenshot(page, violation.selector);
          }

          const finding = ruleViolationToFinding(violation, findings.length, screenshot);
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
function ruleViolationToFinding(
  violation: RuleViolation, 
  index: number,
  screenshot?: string
): Finding {
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
    screenshot,
  };
}