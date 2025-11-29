import { vi } from 'vitest';

/**
 * Mock AI fix suggestion
 */
export interface MockFixSuggestion {
  originalHtml: string;
  fixedHtml: string;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  framework: string;
}

/**
 * Create a mock fix suggestion
 */
export function createMockFixSuggestion(overrides: Partial<MockFixSuggestion> = {}): MockFixSuggestion {
  return {
    originalHtml: '<img src="photo.jpg">',
    fixedHtml: '<img src="photo.jpg" alt="Description of the image">',
    explanation: 'Added alt attribute to provide alternative text for screen readers.',
    confidence: 'high',
    effort: 'low',
    framework: 'html',
    ...overrides,
  };
}

/**
 * Mock the generateFix function
 */
export const mockGenerateFix = vi.fn().mockResolvedValue(createMockFixSuggestion());

/**
 * Mock the generateBatchFixes function
 */
export const mockGenerateBatchFixes = vi.fn().mockResolvedValue([
  createMockFixSuggestion(),
  createMockFixSuggestion({
    originalHtml: '<button></button>',
    fixedHtml: '<button aria-label="Submit form">Submit</button>',
    explanation: 'Added text content and aria-label to button.',
  }),
]);

/**
 * Mock Anthropic client
 */
export const mockAnthropicClient = {
  messages: {
    create: vi.fn().mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify(createMockFixSuggestion()),
        },
      ],
    }),
  },
};