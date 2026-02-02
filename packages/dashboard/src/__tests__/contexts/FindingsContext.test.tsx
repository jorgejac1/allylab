import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { FindingsProvider, useFindings, useFindingsSelectionContext, useFindingsFiltersContext } from '../../contexts/FindingsContext';
import type { TrackedFinding, Severity } from '../../types';

// Mock the false positives utils
vi.mock('../../utils/falsePositives', () => ({
  markAsFalsePositive: vi.fn(),
  unmarkFalsePositive: vi.fn(),
  loadFalsePositives: vi.fn(() => []),
  isFalsePositive: vi.fn(() => false),
  getFalsePositiveEntry: vi.fn(() => undefined),
  applyFalsePositiveStatus: vi.fn((findings: Array<{ falsePositive?: boolean }>) =>
    findings.map((f) => ({ ...f, falsePositive: false }))
  ),
  getFalsePositiveCount: vi.fn(() => 0),
  clearAllFalsePositives: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

const createMockFinding = (id: string, overrides: Partial<TrackedFinding> = {}): TrackedFinding => ({
  id,
  fingerprint: `fp_${id}`,
  ruleId: `rule_${id}`,
  ruleTitle: `Finding ${id}`,
  description: `Description for finding ${id}`,
  impact: 'serious' as Severity,
  html: '<button>Test</button>',
  selector: '.test-button',
  wcagTags: ['wcag2a'],
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/button-name',
  source: 'axe-core',
  status: 'new',
  ...overrides,
});

const createWrapper = (findings: TrackedFinding[], scanUrl = 'https://example.com') => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <FindingsProvider
        findings={findings}
        scanUrl={scanUrl}
        scanStandard="WCAG 2.1 AA"
        scanViewport="desktop"
      >
        {children}
      </FindingsProvider>
    );
  };
};

describe('contexts/FindingsContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('useFindings', () => {
    it('throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => useFindings());
      }).toThrow('useFindings must be used within a FindingsProvider');
    });

    it('provides access to all findings state', () => {
      const findings = [createMockFinding('1'), createMockFinding('2')];
      const { result } = renderHook(() => useFindings(), {
        wrapper: createWrapper(findings),
      });

      expect(result.current.filters).toBeDefined();
      expect(result.current.selection).toBeDefined();
      expect(result.current.pagination).toBeDefined();
      expect(result.current.jira).toBeDefined();
      expect(result.current.verification).toBeDefined();
      expect(result.current.scanUrl).toBe('https://example.com');
      expect(result.current.scanStandard).toBe('WCAG 2.1 AA');
      expect(result.current.scanViewport).toBe('desktop');
    });

    it('provides linked count from jira', () => {
      const findings = [createMockFinding('1'), createMockFinding('2')];
      const { result } = renderHook(() => useFindings(), {
        wrapper: createWrapper(findings),
      });

      expect(typeof result.current.linkedCount).toBe('number');
    });
  });

  describe('selection', () => {
    it('allows selecting findings', () => {
      const findings = [createMockFinding('1'), createMockFinding('2')];
      const { result } = renderHook(() => useFindings(), {
        wrapper: createWrapper(findings),
      });

      expect(result.current.selection.isSelected('1')).toBe(false);

      act(() => {
        result.current.selection.toggleSelect('1');
      });

      expect(result.current.selection.isSelected('1')).toBe(true);
    });

    it('handles select all page', () => {
      const findings = [createMockFinding('1'), createMockFinding('2')];
      const { result } = renderHook(() => useFindings(), {
        wrapper: createWrapper(findings),
      });

      act(() => {
        result.current.handleSelectAllPage();
      });

      expect(result.current.selection.selectedIds.size).toBeGreaterThan(0);
    });

    it('handles select all filtered', () => {
      const findings = [createMockFinding('1'), createMockFinding('2')];
      const { result } = renderHook(() => useFindings(), {
        wrapper: createWrapper(findings),
      });

      act(() => {
        result.current.selectAllFiltered();
      });

      expect(result.current.selection.selectedIds.size).toBe(2);
    });
  });

  describe('filters', () => {
    it('handles severity filter change', () => {
      const findings = [
        createMockFinding('1', { impact: 'critical' }),
        createMockFinding('2', { impact: 'minor' }),
      ];
      const { result } = renderHook(() => useFindings(), {
        wrapper: createWrapper(findings),
      });

      act(() => {
        result.current.handleSeverityFilterChange('critical');
      });

      expect(result.current.filters.severityFilter).toBe('critical');
      expect(result.current.pagination.currentPage).toBe(1);
    });

    it('handles status filter change', () => {
      const findings = [
        createMockFinding('1', { status: 'new' }),
        createMockFinding('2', { status: 'recurring' }),
      ];
      const { result } = renderHook(() => useFindings(), {
        wrapper: createWrapper(findings),
      });

      act(() => {
        result.current.handleStatusFilterChange('new');
      });

      expect(result.current.filters.statusFilter).toBe('new');
    });

    it('handles source filter change', () => {
      const findings = [
        createMockFinding('1', { source: 'axe-core' }),
        createMockFinding('2', { source: 'custom-rule' }),
      ];
      const { result } = renderHook(() => useFindings(), {
        wrapper: createWrapper(findings),
      });

      act(() => {
        result.current.handleSourceFilterChange('axe-core');
      });

      expect(result.current.filters.sourceFilter).toBe('axe-core');
    });

    it('handles fp filter change', () => {
      const findings = [createMockFinding('1'), createMockFinding('2')];
      const { result } = renderHook(() => useFindings(), {
        wrapper: createWrapper(findings),
      });

      act(() => {
        result.current.handleFpFilterChange('false-positive');
      });

      expect(result.current.filters.fpFilter).toBe('false-positive');
    });
  });

  describe('false positive toggling', () => {
    it('calls markAsFalsePositive for active finding', async () => {
      const { markAsFalsePositive } = await import('../../utils/falsePositives');
      const findings = [createMockFinding('1', { falsePositive: false })];
      const { result } = renderHook(() => useFindings(), {
        wrapper: createWrapper(findings),
      });

      act(() => {
        result.current.toggleFalsePositive(findings[0]);
      });

      expect(markAsFalsePositive).toHaveBeenCalledWith('fp_1', 'rule_1');
    });

    it('calls unmarkFalsePositive for false positive finding', async () => {
      const { unmarkFalsePositive } = await import('../../utils/falsePositives');
      const findings = [createMockFinding('1', { falsePositive: true })];
      const { result } = renderHook(() => useFindings(), {
        wrapper: createWrapper(findings),
      });

      act(() => {
        result.current.toggleFalsePositive(findings[0]);
      });

      expect(unmarkFalsePositive).toHaveBeenCalledWith('fp_1');
    });
  });

  describe('specialized context hooks', () => {
    it('useFindingsSelectionContext provides selection state', () => {
      const findings = [createMockFinding('1')];
      const { result } = renderHook(() => useFindingsSelectionContext(), {
        wrapper: createWrapper(findings),
      });

      expect(result.current.selectedIds).toBeDefined();
      expect(result.current.toggleSelect).toBeDefined();
      expect(result.current.isSelected).toBeDefined();
    });

    it('useFindingsFiltersContext provides filter state and handlers', () => {
      const findings = [createMockFinding('1')];
      const { result } = renderHook(() => useFindingsFiltersContext(), {
        wrapper: createWrapper(findings),
      });

      expect(result.current.severityFilter).toBeDefined();
      expect(result.current.handleSeverityFilterChange).toBeDefined();
      expect(result.current.handleFpFilterChange).toBeDefined();
    });
  });
});
