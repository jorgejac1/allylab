import { vi } from 'vitest';
import type { Page, Browser, BrowserContext, ElementHandle } from 'playwright';

/**
 * Create a mock Playwright ElementHandle
 */
export function createMockElementHandle(html = '<div>Mock element</div>'): ElementHandle {
  return {
    evaluate: vi.fn().mockResolvedValue(html),
    getAttribute: vi.fn().mockResolvedValue(null),
    textContent: vi.fn().mockResolvedValue('Mock text content'),
    innerHTML: vi.fn().mockResolvedValue(html),
    isVisible: vi.fn().mockResolvedValue(true),
    click: vi.fn().mockResolvedValue(undefined),
    $: vi.fn().mockResolvedValue(null),
    $$: vi.fn().mockResolvedValue([]),
  } as unknown as ElementHandle;
}

/**
 * Create a mock Playwright Page
 */
export function createMockPage(options: {
  html?: string;
  elements?: ElementHandle[];
} = {}): Page {
  const { html = '<html><body>Mock page</body></html>', elements = [] } = options;

  return {
    goto: vi.fn().mockResolvedValue(null),
    close: vi.fn().mockResolvedValue(undefined),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    waitForSelector: vi.fn().mockResolvedValue(createMockElementHandle()),
    waitForLoadState: vi.fn().mockResolvedValue(undefined),
    content: vi.fn().mockResolvedValue(html),
    title: vi.fn().mockResolvedValue('Mock Page Title'),
    url: vi.fn().mockReturnValue('https://example.com'),
    $: vi.fn().mockResolvedValue(elements[0] || null),
    $$: vi.fn().mockResolvedValue(elements),
    evaluate: vi.fn().mockResolvedValue(null),
    screenshot: vi.fn().mockResolvedValue(Buffer.from('mock-screenshot')),
    setViewportSize: vi.fn().mockResolvedValue(undefined),
  } as unknown as Page;
}

/**
 * Create a mock Playwright BrowserContext
 */
export function createMockContext(): BrowserContext {
  return {
    newPage: vi.fn().mockResolvedValue(createMockPage()),
    close: vi.fn().mockResolvedValue(undefined),
    pages: vi.fn().mockReturnValue([]),
  } as unknown as BrowserContext;
}

/**
 * Create a mock Playwright Browser
 */
export function createMockBrowser(): Browser {
  const mockContext = createMockContext();
  
  return {
    newContext: vi.fn().mockResolvedValue(mockContext),
    close: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    contexts: vi.fn().mockReturnValue([mockContext]),
  } as unknown as Browser;
}

/**
 * Mock axe-core results
 */
export function createMockAxeResults(options: {
  violations?: number;
  passes?: number;
} = {}) {
  const { violations = 2, passes = 10 } = options;

  const mockViolations = Array.from({ length: violations }, (_, i) => ({
    id: `violation-${i + 1}`,
    impact: i === 0 ? 'critical' : 'serious',
    help: `Fix issue ${i + 1}`,
    description: `Description for issue ${i + 1}`,
    helpUrl: `https://dequeuniversity.com/rules/axe/4.0/violation-${i + 1}`,
    tags: ['wcag2a', 'wcag211'],
    nodes: [
      {
        target: [`#element-${i + 1}`],
        html: `<div id="element-${i + 1}">Problem element</div>`,
        failureSummary: 'Fix the element',
      },
    ],
  }));

  return {
    violations: mockViolations,
    passes: Array.from({ length: passes }, (_, i) => ({
      id: `pass-${i + 1}`,
      help: `Passed rule ${i + 1}`,
    })),
    incomplete: [],
    inapplicable: [],
  };
}