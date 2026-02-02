/**
 * Scan API - JSON Response
 *
 * Performs accessibility scans and returns results as JSON (non-streaming).
 */

import { NextRequest, NextResponse } from 'next/server';

interface ScanRequestBody {
  url: string;
  standard?: string;
  viewport?: { width: number; height: number };
  includeWarnings?: boolean;
}

type Impact = 'critical' | 'serious' | 'moderate' | 'minor';

interface MockFinding {
  ruleId: string;
  ruleTitle: string;
  description: string;
  impact: Impact;
  selector: string;
  html: string;
  helpUrl: string;
  wcagTags: string[];
  fixSuggestion: string;
}

// Mock findings for demo mode
const MOCK_FINDINGS: MockFinding[] = [
  {
    ruleId: 'color-contrast',
    ruleTitle: 'Elements must have sufficient color contrast',
    description: 'Text does not have sufficient contrast with the background.',
    impact: 'serious',
    selector: 'p.hero-text',
    html: '<p class="hero-text" style="color: #999">Welcome to our site</p>',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/color-contrast',
    wcagTags: ['wcag2aa', 'wcag143'],
    fixSuggestion: 'Increase the color contrast ratio to at least 4.5:1 for normal text.',
  },
  {
    ruleId: 'image-alt',
    ruleTitle: 'Images must have alternate text',
    description: 'Image element is missing an alt attribute.',
    impact: 'critical',
    selector: 'img.logo',
    html: '<img class="logo" src="/logo.png">',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/image-alt',
    wcagTags: ['wcag2a', 'wcag111'],
    fixSuggestion: 'Add an alt attribute that describes the image content.',
  },
  {
    ruleId: 'link-name',
    ruleTitle: 'Links must have discernible text',
    description: 'Link has no accessible name.',
    impact: 'serious',
    selector: 'a.icon-link',
    html: '<a class="icon-link" href="/settings"><svg>...</svg></a>',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/link-name',
    wcagTags: ['wcag2a', 'wcag244', 'wcag412'],
    fixSuggestion: 'Add an aria-label or visible text to describe the link destination.',
  },
  {
    ruleId: 'button-name',
    ruleTitle: 'Buttons must have discernible text',
    description: 'Button has no accessible name.',
    impact: 'critical',
    selector: 'button.close-btn',
    html: '<button class="close-btn"><span class="icon">×</span></button>',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/button-name',
    wcagTags: ['wcag2a', 'wcag412'],
    fixSuggestion: 'Add an aria-label attribute like aria-label="Close dialog".',
  },
  {
    ruleId: 'label',
    ruleTitle: 'Form elements must have labels',
    description: 'Form input does not have a corresponding label.',
    impact: 'critical',
    selector: 'input#search',
    html: '<input type="text" id="search" placeholder="Search...">',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/label',
    wcagTags: ['wcag2a', 'wcag412', 'wcag131'],
    fixSuggestion: 'Add a <label for="search"> element or an aria-label attribute.',
  },
  {
    ruleId: 'heading-order',
    ruleTitle: 'Heading levels should increase by one',
    description: 'Heading levels should only increase by one level at a time.',
    impact: 'moderate',
    selector: 'h4.section-title',
    html: '<h4 class="section-title">Features</h4>',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/heading-order',
    wcagTags: ['wcag2a', 'wcag131'],
    fixSuggestion: 'Use proper heading hierarchy (h1 → h2 → h3) without skipping levels.',
  },
  {
    ruleId: 'html-has-lang',
    ruleTitle: 'html element must have a lang attribute',
    description: 'The HTML element does not have a lang attribute.',
    impact: 'serious',
    selector: 'html',
    html: '<html>',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/html-has-lang',
    wcagTags: ['wcag2a', 'wcag311'],
    fixSuggestion: 'Add a lang attribute to the html element, e.g., <html lang="en">.',
  },
  {
    ruleId: 'focus-visible',
    ruleTitle: 'Interactive elements must have visible focus indicators',
    description: 'Focus indicator is not visible when element receives focus.',
    impact: 'serious',
    selector: 'a.nav-link',
    html: '<a class="nav-link" href="/about">About</a>',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/focus-visible',
    wcagTags: ['wcag2aa', 'wcag247'],
    fixSuggestion: 'Ensure focus styles are visible. Do not use outline: none without alternative.',
  },
  {
    ruleId: 'meta-viewport',
    ruleTitle: 'Zooming and scaling should not be disabled',
    description: 'The viewport meta tag should not disable user scaling.',
    impact: 'minor',
    selector: 'meta[name="viewport"]',
    html: '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/meta-viewport',
    wcagTags: ['wcag2aa', 'wcag144'],
    fixSuggestion: 'Remove maximum-scale=1 and user-scalable=no from the viewport meta tag.',
  },
];

export async function POST(request: NextRequest) {
  try {
    const body: ScanRequestBody = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Randomly select 4-8 findings for this scan
    const numFindings = Math.floor(Math.random() * 5) + 4;
    const shuffled = [...MOCK_FINDINGS].sort(() => 0.5 - Math.random());
    const selectedFindings = shuffled.slice(0, numFindings);

    // Build findings with IDs
    const findings = selectedFindings.map((f, i) => ({
      ...f,
      id: `finding-${Date.now()}-${i}`,
      page: url,
    }));

    // Calculate metrics
    const critical = findings.filter(f => f.impact === 'critical').length;
    const serious = findings.filter(f => f.impact === 'serious').length;
    const moderate = findings.filter(f => f.impact === 'moderate').length;
    const minor = findings.filter(f => f.impact === 'minor').length;

    // Score calculation (100 - weighted issues)
    const score = Math.max(0, Math.min(100,
      100 - (critical * 15 + serious * 8 + moderate * 4 + minor * 1)
    ));

    const result = {
      id: `scan-${Date.now()}`,
      url,
      timestamp: new Date().toISOString(),
      score,
      totalIssues: findings.length,
      critical,
      serious,
      moderate,
      minor,
      findings,
      scanDuration: 2000 + Math.random() * 1500,
      viewport: body.viewport || { width: 1920, height: 1080 },
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
