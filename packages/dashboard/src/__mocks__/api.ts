import { vi } from 'vitest';
import type { ScanResult, SavedScan, Finding } from '../types';

/**
 * Create a mock finding
 */
export function createMockFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'finding-1',
    ruleId: 'image-alt',
    ruleTitle: 'Images must have alternate text',
    description: 'Ensures <img> elements have alternate text or a role of none or presentation.',
    impact: 'critical',
    selector: 'img',
    html: '<img src="photo.jpg">',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/image-alt',
    wcagTags: ['wcag2a', 'wcag111'],
    ...overrides,
  };
}

/**
 * Create a mock scan result
 */
export function createMockScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
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
    findings: [createMockFinding()],
    scanDuration: 5000,
    viewport: 'desktop',
    ...overrides,
  };
}

/**
 * Create a mock saved scan
 */
export function createMockSavedScan(overrides: Partial<SavedScan> = {}): SavedScan {
  return {
    ...createMockScanResult(),
    ...overrides,
  };
}

/**
 * Mock fetch responses for API calls
 */
export function mockApiResponse<T>(data: T, options: { ok?: boolean; status?: number } = {}) {
  const { ok = true, status = 200 } = options;
  
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  });
}

/**
 * Mock API base URL
 */
export const MOCK_API_BASE = 'http://localhost:3001';

/**
 * Mock getApiBase function
 */
export const mockGetApiBase = vi.fn().mockReturnValue(MOCK_API_BASE);