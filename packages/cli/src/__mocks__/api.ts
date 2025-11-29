import { vi } from 'vitest';

/**
 * Mock API response for CLI
 */
export function createMockCliScanResult() {
  return {
    id: 'scan-123',
    url: 'https://example.com',
    timestamp: new Date().toISOString(),
    score: 75,
    totalIssues: 10,
    critical: 1,
    serious: 3,
    moderate: 4,
    minor: 2,
    findings: [],
    scanDuration: 5000,
  };
}

/**
 * Mock fetch for CLI
 */
export const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({ success: true, data: createMockCliScanResult() }),
  body: {
    getReader: vi.fn().mockReturnValue({
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"complete"}\n\n') })
        .mockResolvedValueOnce({ done: true }),
    }),
  },
});