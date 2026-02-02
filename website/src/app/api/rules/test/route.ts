/**
 * Custom Rules Test API
 *
 * Tests a custom rule against a URL before saving.
 */

import { NextRequest, NextResponse } from 'next/server';

interface TestRuleRequest {
  selector: string;
  check: string;
  url: string;
}

interface TestResult {
  success: boolean;
  matchedElements: number;
  passedElements: number;
  failedElements: number;
  samples: Array<{
    html: string;
    passed: boolean;
    reason?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: TestRuleRequest = await request.json();
    const { selector, check, url } = body;

    if (!selector || !check || !url) {
      return NextResponse.json(
        { error: 'Selector, check, and URL are required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // In production:
    // 1. Fetch the URL with Puppeteer/Playwright
    // 2. Run the selector to find matching elements
    // 3. Run the check against each element
    // 4. Return results

    // For demo, simulate test results
    await new Promise(resolve => setTimeout(resolve, 1000));

    const matchedElements = Math.floor(Math.random() * 10) + 1;
    const passedElements = Math.floor(Math.random() * matchedElements);
    const failedElements = matchedElements - passedElements;

    const result: TestResult = {
      success: true,
      matchedElements,
      passedElements,
      failedElements,
      samples: [
        {
          html: `<div class="example">${selector}</div>`,
          passed: passedElements > 0,
          reason: passedElements > 0 ? undefined : `Failed check: ${check}`,
        },
        {
          html: `<span class="test">${selector}</span>`,
          passed: failedElements === 0,
          reason: failedElements > 0 ? `Element does not satisfy: ${check}` : undefined,
        },
      ].slice(0, matchedElements > 1 ? 2 : 1),
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test failed' },
      { status: 500 }
    );
  }
}
