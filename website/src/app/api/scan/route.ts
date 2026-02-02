/**
 * Scan API - SSE Streaming
 *
 * Performs accessibility scans with real-time progress updates via Server-Sent Events.
 */

import { NextRequest } from 'next/server';

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
  },
  {
    ruleId: 'image-alt',
    ruleTitle: 'Images must have alternate text',
    description: 'Image element is missing an alt attribute.',
    impact: 'critical' ,
    selector: 'img.logo',
    html: '<img class="logo" src="/logo.png">',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/image-alt',
    wcagTags: ['wcag2a', 'wcag111'],
  },
  {
    ruleId: 'link-name',
    ruleTitle: 'Links must have discernible text',
    description: 'Link has no accessible name.',
    impact: 'serious' ,
    selector: 'a.icon-link',
    html: '<a class="icon-link" href="/settings"><svg>...</svg></a>',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/link-name',
    wcagTags: ['wcag2a', 'wcag244', 'wcag412'],
  },
  {
    ruleId: 'button-name',
    ruleTitle: 'Buttons must have discernible text',
    description: 'Button has no accessible name.',
    impact: 'critical' ,
    selector: 'button.close-btn',
    html: '<button class="close-btn"><span class="icon">×</span></button>',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/button-name',
    wcagTags: ['wcag2a', 'wcag412'],
  },
  {
    ruleId: 'label',
    ruleTitle: 'Form elements must have labels',
    description: 'Form input does not have a corresponding label.',
    impact: 'critical' ,
    selector: 'input#search',
    html: '<input type="text" id="search" placeholder="Search...">',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/label',
    wcagTags: ['wcag2a', 'wcag412', 'wcag131'],
  },
  {
    ruleId: 'heading-order',
    ruleTitle: 'Heading levels should increase by one',
    description: 'Heading levels should only increase by one level at a time.',
    impact: 'moderate' ,
    selector: 'h4.section-title',
    html: '<h4 class="section-title">Features</h4>',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/heading-order',
    wcagTags: ['wcag2a', 'wcag131'],
  },
  {
    ruleId: 'html-has-lang',
    ruleTitle: 'html element must have a lang attribute',
    description: 'The HTML element does not have a lang attribute.',
    impact: 'serious' ,
    selector: 'html',
    html: '<html>',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/html-has-lang',
    wcagTags: ['wcag2a', 'wcag311'],
  },
  {
    ruleId: 'focus-order-semantics',
    ruleTitle: 'Focus should be managed programmatically',
    description: 'Interactive elements should be focusable with keyboard.',
    impact: 'minor' ,
    selector: 'div.clickable-card',
    html: '<div class="clickable-card" onclick="navigate()">Click me</div>',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/focus-order-semantics',
    wcagTags: ['wcag2a', 'wcag211'],
  },
];

export async function POST(request: NextRequest) {
  try {
    const body: ScanRequestBody = await request.json();
    const { url } = body;

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Status: connecting
          send('status', { message: 'Connecting to target URL...', phase: 'init' });
          await delay(500);

          // Status: loading page
          send('status', { message: `Loading ${url}...`, phase: 'loading' });
          send('progress', { percent: 10, message: 'Page loaded' });
          await delay(800);

          // Status: analyzing
          send('status', { message: 'Analyzing accessibility...', phase: 'analyzing' });
          send('progress', { percent: 25, message: 'Running WCAG tests' });
          await delay(600);

          // Randomly select 4-8 findings for this scan
          const numFindings = Math.floor(Math.random() * 5) + 4;
          const shuffled = [...MOCK_FINDINGS].sort(() => 0.5 - Math.random());
          const selectedFindings = shuffled.slice(0, numFindings);

          // Stream findings one by one
          for (let i = 0; i < selectedFindings.length; i++) {
            const finding = {
              ...selectedFindings[i],
              id: `finding-${Date.now()}-${i}`,
              page: url,
            };
            send('finding', finding);
            send('progress', {
              percent: 25 + Math.round((i / selectedFindings.length) * 50),
              message: `Found: ${finding.ruleTitle}`,
            });
            await delay(300 + Math.random() * 400);
          }

          // Processing results
          send('status', { message: 'Processing results...', phase: 'processing' });
          send('progress', { percent: 85, message: 'Calculating score' });
          await delay(500);

          // Calculate metrics
          const findings = selectedFindings.map((f, i) => ({
            ...f,
            id: `finding-${Date.now()}-${i}`,
            page: url,
          }));

          const critical = findings.filter(f => f.impact === 'critical').length;
          const serious = findings.filter(f => f.impact === 'serious').length;
          const moderate = findings.filter(f => f.impact === 'moderate').length;
          const minor = findings.filter(f => f.impact === 'minor').length;

          // Score calculation (100 - weighted issues)
          const score = Math.max(0, Math.min(100,
            100 - (critical * 15 + serious * 8 + moderate * 4 + minor * 1)
          ));

          // Send complete result
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
            scanDuration: 3500 + Math.random() * 1500,
            viewport: body.viewport || { width: 1920, height: 1080 },
          };

          send('progress', { percent: 100, message: 'Scan complete' });
          send('complete', result);

        } catch (error) {
          send('error', {
            message: error instanceof Error ? error.message : 'Scan failed',
          });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
