import type { Page } from 'playwright';
import type { CustomRule, RuleViolation } from '../types/rules';
import { getEnabledRules } from '../routes/rules';
import { ruleLogger } from '../utils/logger.js';

interface EvaluateOptions {
  page: Page;
  onViolation?: (violation: RuleViolation) => void;
}

/**
 * Evaluate custom rules against a page using Playwright
 */
export async function evaluateCustomRules(options: EvaluateOptions): Promise<RuleViolation[]> {
  const { page, onViolation } = options;
  const rules = await getEnabledRules();
  const violations: RuleViolation[] = [];

  if (rules.length === 0) {
    return violations;
  }

  for (const rule of rules) {
    try {
      const ruleViolations = await evaluateRule(page, rule);
      
      for (const violation of ruleViolations) {
        violations.push(violation);
        onViolation?.(violation);
      }
    } catch (error) {
      ruleLogger.error({ msg: 'Error evaluating rule', ruleId: rule.id, err: error });
    }
  }

  return violations;
}

/**
 * Evaluate a single rule against the page
 */
async function evaluateRule(page: Page, rule: CustomRule): Promise<RuleViolation[]> {
  const violations: RuleViolation[] = [];

  switch (rule.type) {
    case 'selector':
      return evaluateSelectorRule(page, rule);
    case 'attribute':
      return evaluateAttributeRule(page, rule);
    case 'content':
      return evaluateContentRule(page, rule);
    case 'structure':
      return evaluateStructureRule(page, rule);
    default:
      return violations;
  }
}

/**
 * Selector rule: Check if elements exist or don't exist
 */
async function evaluateSelectorRule(page: Page, rule: CustomRule): Promise<RuleViolation[]> {
  const violations: RuleViolation[] = [];
  const { selector, condition } = rule;
  const operator = condition.operator || 'exists';

  const elements = await page.$$(selector);

  if (operator === 'not-exists' && elements.length === 0) {
    // Element should exist but doesn't
    violations.push(createViolation(rule, selector, '', `Required element not found: ${selector}`));
  } else if (operator === 'exists' && elements.length > 0) {
    // Element exists but shouldn't
    for (const element of elements) {
      const html = await element.evaluate(el => el.outerHTML.slice(0, 200));
      violations.push(createViolation(rule, selector, html));
    }
  }

  return violations;
}

/**
 * Attribute rule: Check element attributes
 */
async function evaluateAttributeRule(page: Page, rule: CustomRule): Promise<RuleViolation[]> {
  const violations: RuleViolation[] = [];
  const { selector, condition } = rule;
  const { attribute, operator = 'exists', value } = condition;

  if (!attribute) return violations;

  const elements = await page.$$(selector);

  for (const element of elements) {
    const attrValue = await element.getAttribute(attribute);
    const html = await element.evaluate(el => el.outerHTML.slice(0, 200));
    let isViolation = false;

    switch (operator) {
      case 'exists':
        isViolation = attrValue !== null;
        break;
      case 'not-exists':
        isViolation = attrValue === null;
        break;
      case 'equals':
        isViolation = attrValue === value;
        break;
      case 'not-equals':
        isViolation = attrValue !== value;
        break;
      case 'contains':
        isViolation = attrValue !== null && value !== undefined && attrValue.includes(value);
        break;
      case 'matches':
        if (attrValue !== null && value) {
          try {
            const regex = new RegExp(value);
            isViolation = regex.test(attrValue);
          } catch {
            // Invalid regex, skip
          }
        }
        break;
    }

    if (isViolation) {
      violations.push(createViolation(rule, selector, html));
    }
  }

  return violations;
}

/**
 * Content rule: Check text content length/pattern
 */
async function evaluateContentRule(page: Page, rule: CustomRule): Promise<RuleViolation[]> {
  const violations: RuleViolation[] = [];
  const { selector, condition } = rule;
  const { minLength, maxLength, pattern } = condition;

  const elements = await page.$$(selector);

  for (const element of elements) {
    const textContent = await element.textContent() || '';
    const html = await element.evaluate(el => el.outerHTML.slice(0, 200));
    let isViolation = false;

    if (minLength !== undefined && textContent.length < minLength) {
      isViolation = true;
    }

    if (maxLength !== undefined && textContent.length > maxLength) {
      isViolation = true;
    }

    if (pattern) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(textContent)) {
          isViolation = true;
        }
      } catch {
        // Invalid regex, skip
      }
    }

    if (isViolation) {
      violations.push(createViolation(rule, selector, html));
    }
  }

  return violations;
}

/**
 * Structure rule: Check parent/child/sibling relationships
 */
async function evaluateStructureRule(page: Page, rule: CustomRule): Promise<RuleViolation[]> {
  const violations: RuleViolation[] = [];
  const { selector, condition } = rule;
  const { parent, children, siblings } = condition;

  const elements = await page.$$(selector);

  for (const element of elements) {
    const html = await element.evaluate(el => el.outerHTML.slice(0, 200));
    let isViolation = false;

    // Check parent requirement
    if (parent) {
      const hasParent = await element.evaluate((el, parentSelector) => {
        return el.closest(parentSelector) !== null;
      }, parent);
      
      if (!hasParent) {
        isViolation = true;
      }
    }

    // Check children requirement
    if (children) {
      const hasChildren = await element.evaluate((el, childSelector) => {
        return el.querySelector(childSelector) !== null;
      }, children);
      
      if (!hasChildren) {
        isViolation = true;
      }
    }

    // Check siblings requirement
    if (siblings) {
      const hasSiblings = await element.evaluate((el, siblingSelector) => {
        const parent = el.parentElement;
        if (!parent) return false;
        return parent.querySelector(siblingSelector) !== null;
      }, siblings);
      
      if (!hasSiblings) {
        isViolation = true;
      }
    }

    if (isViolation) {
      violations.push(createViolation(rule, selector, html));
    }
  }

  return violations;
}

/**
 * Create a violation object from a rule
 */
function createViolation(
  rule: CustomRule, 
  selector: string, 
  html: string,
  customMessage?: string
): RuleViolation {
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    selector,
    html,
    message: customMessage || rule.message,
    severity: rule.severity,
    wcagTags: rule.wcagTags,
  };
}

/**
 * Get count of enabled custom rules
 */
export async function getEnabledRulesCount(): Promise<number> {
  return (await getEnabledRules()).length;
}