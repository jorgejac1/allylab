import AxeBuilder from '@axe-core/playwright';
import type { Page, BrowserContext } from 'playwright';
import {
  acquirePage,
  releasePage,
  destroyPage,
  createAuthenticatedContext,
  executeLoginFlow,
  closeAuthenticatedContext,
} from './browser.js';
import { calculateScore } from '../utils/scoring.js';
import { getWcagTags } from '../utils/wcag.js';
import { evaluateCustomRules, getEnabledRulesCount } from './rule-evaluator.js';
import { config } from '../config/env.js';
import type { Finding, ScanResult, Severity, Viewport, ScanAuthOptions } from '../types/index.js';
import type { RuleViolation } from '../types/rules.js';
import { scannerLogger } from '../utils/logger.js';

/**
 * Scan timeout error - thrown when scan exceeds total timeout
 */
export class ScanTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScanTimeoutError';
  }
}

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
  auth?: ScanAuthOptions;
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
    auth,
    onProgress,
    onFinding
  } = options;

  const startTime = Date.now();
  const viewportLabel = viewport === 'desktop' ? '🖥️ Desktop' : viewport === 'tablet' ? '📱 Tablet' : '📲 Mobile';
  const customRulesCount = includeCustomRules ? await getEnabledRulesCount() : 0;

  // Wrap scan in total timeout
  const scanWithTimeout = async (): Promise<ScanResult> => {
    let page: Page | undefined;
    let authenticatedContext: BrowserContext | null = null;
    let scanFailed = false;

    // Determine if using authenticated context or page pool
    const useAuth = !!(auth && (auth.cookies || auth.headers || auth.storageState || auth.basicAuth || auth.loginFlow));

    try {
      if (useAuth) {
        // Create authenticated context (not from pool)
        onProgress?.({ percent: 5, message: 'Setting up authenticated session...' });
        scannerLogger.info({ msg: 'Using authenticated scanning', url, hasLoginFlow: !!auth?.loginFlow });

        const authResult = await createAuthenticatedContext(viewport, auth!);
        page = authResult.page;
        authenticatedContext = authResult.context;

        // Execute login flow if provided
        if (auth?.loginFlow) {
          onProgress?.({ percent: 8, message: 'Executing login flow...' });
          const loginSuccess = await executeLoginFlow(page, auth.loginFlow);

          if (!loginSuccess) {
            throw new Error('Login flow failed - could not authenticate. Check your login steps and success indicator.');
          }

          scannerLogger.info({ msg: 'Login flow completed successfully', url });
        }
      } else {
        // Use page pool for unauthenticated scans
        page = await acquirePage(viewport, config.scanPageAcquireTimeout);
      }

      // TypeScript assertion - page is guaranteed to be assigned at this point
      const activePage = page!;

      onProgress?.({ percent: 10, message: `Navigating to page (${viewportLabel})...` });

      // Use domcontentloaded instead of networkidle
      try {
        await activePage.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: config.scanNavigationTimeout,
        });
      } catch (navError) {
        if (navError instanceof Error && navError.message.includes('Timeout')) {
          onProgress?.({ percent: 15, message: 'Page loading slowly, continuing scan...' });
          await activePage.goto(url, {
            waitUntil: 'commit',
            timeout: config.scanNavigationTimeout / 2,
          });
        } else {
          throw navError;
        }
      }

    // Wait a bit for JavaScript to render content
    onProgress?.({ percent: 30, message: 'Waiting for page to render...' });
    await activePage.waitForTimeout(2000);

    onProgress?.({ percent: 40, message: `Running accessibility scan (${viewportLabel})...` });

    // Run axe-core
    const axeBuilder = new AxeBuilder({ page: activePage })
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
          screenshot = await captureElementScreenshot(activePage, selector);
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
        page: activePage,
        onViolation: async (violation) => {
          // Capture screenshot for custom rule violations too
          let screenshot: string | undefined;
          if (captureScreenshots) {
            screenshot = await captureElementScreenshot(activePage, violation.selector);
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
    } catch (error) {
      scanFailed = true;
      throw error;
    } finally {
      // Clean up based on whether we used authenticated context or pool
      if (authenticatedContext) {
        // Close the authenticated context (not returned to pool)
        await closeAuthenticatedContext(authenticatedContext);
      } else if (page) {
        // Page pool cleanup
        if (scanFailed) {
          await destroyPage(page);
        } else {
          await releasePage(page);
        }
      }
    }
  };

  // Apply total scan timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new ScanTimeoutError(`Scan timed out after ${config.scanTotalTimeout}ms`));
    }, config.scanTotalTimeout);
  });

  return Promise.race([scanWithTimeout(), timeoutPromise]);
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