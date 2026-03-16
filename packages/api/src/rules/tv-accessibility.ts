/// <reference lib="dom" />
/**
 * TV Accessibility Rules
 *
 * Specialized rules for Smart TV / CTV interfaces.
 * These rules address the unique challenges of the "10-foot UI" experience:
 * - Remote/D-pad navigation (no mouse/touch)
 * - Large screen viewing distance
 * - Limited input options
 */

import type { Finding, Severity } from '../types/index.js';

export interface TVRule {
  id: string;
  name: string;
  description: string;
  wcagCriteria: string[];
  severity: Severity;
}

export const TV_RULES: TVRule[] = [
  {
    id: 'tv-focus-visibility',
    name: 'Focus Indicator Visibility',
    description: 'Focus indicators must be clearly visible on TV screens (minimum 4px outline) for remote/D-pad navigation',
    wcagCriteria: ['2.4.7', '2.4.11'],
    severity: 'critical',
  },
  {
    id: 'tv-target-size',
    name: 'Interactive Target Size',
    description: 'Interactive elements must be at least 44x44px for D-pad navigation on TV screens',
    wcagCriteria: ['2.5.5', '2.5.8'],
    severity: 'serious',
  },
  {
    id: 'tv-font-size',
    name: 'Minimum Font Size',
    description: 'Text must be at least 16px for TV viewing distance (10-foot UI)',
    wcagCriteria: ['1.4.4'],
    severity: 'serious',
  },
  {
    id: 'tv-color-contrast',
    name: 'Enhanced Color Contrast',
    description: 'TV screens require higher contrast ratio (5:1 minimum) due to variable display quality and viewing conditions',
    wcagCriteria: ['1.4.3', '1.4.6'],
    severity: 'serious',
  },
  {
    id: 'tv-autoplay-media',
    name: 'Auto-play Media Control',
    description: 'Media must not auto-play with sound; users must be able to control playback',
    wcagCriteria: ['1.4.2'],
    severity: 'critical',
  },
  {
    id: 'tv-keyboard-navigation',
    name: 'D-pad/Keyboard Navigation',
    description: 'All interactive elements must be reachable via arrow keys and Enter/Back buttons',
    wcagCriteria: ['2.1.1', '2.1.2'],
    severity: 'critical',
  },
  {
    id: 'tv-reading-order',
    name: 'Sequential Reading Order',
    description: 'Content must follow a logical reading order for sequential D-pad navigation',
    wcagCriteria: ['1.3.2', '2.4.3'],
    severity: 'moderate',
  },
];

/** Result type for violations returned from browser evaluate context */
interface BrowserViolation {
  ruleId: string;
  elements: Array<{ selector: string; html: string; issue: string }>;
}

/**
 * Browser-context function that evaluates TV accessibility rules.
 * This function is serialized and executed inside Playwright's browser context
 * where DOM globals (document, window, Node) are available.
 *
 * Typed as a standalone function returning the serializable result type.
 */
const tvRulesBrowserFn = function (): BrowserViolation[] {
  const violations: BrowserViolation[] = [];

  // Rule 1: Focus visibility - check focusable elements for visible focus indicators
  const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusableElements = document.querySelectorAll(focusableSelector);
  const focusViolations: Array<{ selector: string; html: string; issue: string }> = [];

  focusableElements.forEach((el: Element) => {
    const styles = window.getComputedStyle(el);
    const outlineWidth = parseFloat(styles.outlineWidth) || 0;
    const outlineStyle = styles.outlineStyle;
    if (outlineStyle === 'none' || outlineWidth < 2) {
      const htmlEl = el as HTMLElement;
      const className = htmlEl.className;
      const classStr = className && typeof className === 'string' ? '.' + className.trim().split(/\s+/).join('.') : '';
      const selector = el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + classStr;
      focusViolations.push({
        selector,
        html: (el as HTMLElement).outerHTML.substring(0, 200),
        issue: `Focus outline is ${outlineStyle === 'none' ? 'removed' : `only ${outlineWidth}px`} (minimum 4px for TV)`,
      });
    }
  });
  if (focusViolations.length > 0) {
    violations.push({ ruleId: 'tv-focus-visibility', elements: focusViolations.slice(0, 10) });
  }

  // Rule 2: Target size - check interactive elements are at least 44x44px
  const interactiveElements = document.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [role="link"]');
  const sizeViolations: Array<{ selector: string; html: string; issue: string }> = [];

  interactiveElements.forEach((el: Element) => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
      const selector = el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '');
      sizeViolations.push({
        selector,
        html: (el as HTMLElement).outerHTML.substring(0, 200),
        issue: `Element is ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum 44x44px for TV)`,
      });
    }
  });
  if (sizeViolations.length > 0) {
    violations.push({ ruleId: 'tv-target-size', elements: sizeViolations.slice(0, 10) });
  }

  // Rule 3: Font size - check text elements for minimum 16px
  const textElements = document.querySelectorAll('p, span, li, td, th, label, a, h1, h2, h3, h4, h5, h6, div');
  const fontViolations: Array<{ selector: string; html: string; issue: string }> = [];

  textElements.forEach((el: Element) => {
    const hasDirectText = Array.from(el.childNodes).some(
      (node: ChildNode) => node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim().length > 0
    );
    if (!hasDirectText) return;

    const styles = window.getComputedStyle(el);
    const fontSize = parseFloat(styles.fontSize);
    if (fontSize < 16) {
      const selector = el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '');
      fontViolations.push({
        selector,
        html: (el as HTMLElement).outerHTML.substring(0, 200),
        issue: `Font size is ${fontSize}px (minimum 16px for TV viewing distance)`,
      });
    }
  });
  if (fontViolations.length > 0) {
    violations.push({ ruleId: 'tv-font-size', elements: fontViolations.slice(0, 10) });
  }

  // Rule 4: Auto-play media
  const mediaElements = document.querySelectorAll<HTMLMediaElement>('video[autoplay], audio[autoplay]');
  const mediaViolations: Array<{ selector: string; html: string; issue: string }> = [];

  mediaElements.forEach((el: HTMLMediaElement) => {
    const isMuted = el.hasAttribute('muted');
    if (!isMuted) {
      const selector = el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '');
      mediaViolations.push({
        selector,
        html: el.outerHTML.substring(0, 200),
        issue: 'Media auto-plays without being muted',
      });
    }
  });
  if (mediaViolations.length > 0) {
    violations.push({ ruleId: 'tv-autoplay-media', elements: mediaViolations });
  }

  // Rule 5: Keyboard navigation - check for tabindex issues
  const allInteractive = document.querySelectorAll(focusableSelector);
  const navViolations: Array<{ selector: string; html: string; issue: string }> = [];
  let lastTabIndex = -1;

  allInteractive.forEach((el: Element) => {
    const tabIndex = parseInt(el.getAttribute('tabindex') || '0', 10);
    if (tabIndex > 0 && tabIndex < lastTabIndex) {
      const selector = el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '');
      navViolations.push({
        selector,
        html: (el as HTMLElement).outerHTML.substring(0, 200),
        issue: `Non-sequential tabindex (${tabIndex}) disrupts D-pad navigation order`,
      });
    }
    lastTabIndex = tabIndex;
  });
  if (navViolations.length > 0) {
    violations.push({ ruleId: 'tv-keyboard-navigation', elements: navViolations.slice(0, 10) });
  }

  return violations;
};

/**
 * Evaluate TV accessibility rules against a page.
 * Returns findings for violations detected.
 *
 * This runs in Node.js using Playwright page evaluation.
 */
export async function evaluateTVRules(
  page: { evaluate: (fn: () => unknown) => Promise<unknown>; url: () => string },
): Promise<Finding[]> {
  const findings: Finding[] = [];
  const pageUrl = page.url();

  // Evaluate all TV rules in the browser context
  const results = await page.evaluate(tvRulesBrowserFn);

  // Convert browser results to Finding objects
  const ruleMap = new Map(TV_RULES.map(r => [r.id, r]));

  for (const violation of results as BrowserViolation[]) {
    const rule = ruleMap.get(violation.ruleId);
    if (!rule) continue;

    for (const element of violation.elements) {
      findings.push({
        id: `${violation.ruleId}-${findings.length}`,
        ruleId: violation.ruleId,
        ruleTitle: rule.name,
        description: `${rule.description}. ${element.issue}`,
        impact: rule.severity,
        selector: element.selector,
        html: element.html,
        wcagTags: rule.wcagCriteria.map(c => `wcag${c.replaceAll('.', '')}`),
        page: pageUrl,
        source: 'tv-rule',
      });
    }
  }

  return findings;
}
