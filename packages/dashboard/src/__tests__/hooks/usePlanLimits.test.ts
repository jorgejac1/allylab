import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Organization, PlanSettings } from '../../types/auth';

// ── Mocks ──────────────────────────────────────────────────────────
const mockUseAuth = vi.hoisted(() => vi.fn());
vi.mock('../../contexts', () => ({ useAuth: mockUseAuth }));

const mockGetMonthlyUsage = vi.hoisted(() => vi.fn());
const mockIncrementUsage = vi.hoisted(() => vi.fn());
vi.mock('../../utils/usageTracking', () => ({
  getMonthlyUsage: mockGetMonthlyUsage,
  incrementUsage: mockIncrementUsage,
}));

import { usePlanLimits } from '../../hooks/usePlanLimits';

// ── Helpers ────────────────────────────────────────────────────────
function buildOrganization(overrides: Partial<PlanSettings> = {}, plan: Organization['plan'] = 'free'): Organization {
  const defaultSettings: PlanSettings = {
    maxUsers: 3,
    maxScansPerMonth: 5,
    maxAiFixesPerMonth: 10,
    maxGitHubPRsPerMonth: 5,
    maxCustomRules: 5,
    maxApiRequestsPerHour: 100,
    scheduledScans: false,
    scheduledScanFrequency: 'none',
    jiraIntegration: false,
    slackIntegration: false,
    apiAccess: false,
    ssoEnabled: false,
    selfHosted: false,
    auditLogs: false,
    exportFormats: ['csv'],
  };

  return {
    id: 'org-1',
    name: 'Test Org',
    plan,
    ownerId: 'user-1',
    createdAt: new Date().toISOString(),
    settings: { ...defaultSettings, ...overrides },
  };
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

describe('hooks/usePlanLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMonthlyUsage.mockReturnValue({
      scans: 0,
      aiFixes: 0,
      prs: 0,
      month: currentMonth(),
    });
  });

  // ────────────────────────────────────────────────────────────────
  // canScan
  // ────────────────────────────────────────────────────────────────
  describe('canScan', () => {
    it('returns true when usage is below the limit (free plan)', () => {
      const org = buildOrganization({ maxScansPerMonth: 5 });
      mockUseAuth.mockReturnValue({ organization: org });
      mockGetMonthlyUsage.mockReturnValue({ scans: 3, aiFixes: 0, prs: 0, month: currentMonth() });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.canScan).toBe(true);
    });

    it('returns false when usage equals or exceeds the limit (free plan)', () => {
      const org = buildOrganization({ maxScansPerMonth: 5 });
      mockUseAuth.mockReturnValue({ organization: org });
      mockGetMonthlyUsage.mockReturnValue({ scans: 5, aiFixes: 0, prs: 0, month: currentMonth() });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.canScan).toBe(false);
    });

    it('returns true when plan is unlimited (-1)', () => {
      const org = buildOrganization({ maxScansPerMonth: -1 }, 'pro');
      mockUseAuth.mockReturnValue({ organization: org });
      mockGetMonthlyUsage.mockReturnValue({ scans: 999, aiFixes: 0, prs: 0, month: currentMonth() });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.canScan).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // canUseSchedules
  // ────────────────────────────────────────────────────────────────
  describe('canUseSchedules', () => {
    it('reflects organization.settings.scheduledScans = true', () => {
      const org = buildOrganization({ scheduledScans: true });
      mockUseAuth.mockReturnValue({ organization: org });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.canUseSchedules).toBe(true);
    });

    it('reflects organization.settings.scheduledScans = false', () => {
      const org = buildOrganization({ scheduledScans: false });
      mockUseAuth.mockReturnValue({ organization: org });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.canUseSchedules).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // canUseJira
  // ────────────────────────────────────────────────────────────────
  describe('canUseJira', () => {
    it('reflects organization.settings.jiraIntegration = true', () => {
      const org = buildOrganization({ jiraIntegration: true });
      mockUseAuth.mockReturnValue({ organization: org });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.canUseJira).toBe(true);
    });

    it('reflects organization.settings.jiraIntegration = false', () => {
      const org = buildOrganization({ jiraIntegration: false });
      mockUseAuth.mockReturnValue({ organization: org });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.canUseJira).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // canExport
  // ────────────────────────────────────────────────────────────────
  describe('canExport', () => {
    it('returns true when format is in exportFormats', () => {
      const org = buildOrganization({ exportFormats: ['csv', 'pdf'] });
      mockUseAuth.mockReturnValue({ organization: org });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.canExport('pdf')).toBe(true);
    });

    it('returns false when format is not in exportFormats', () => {
      const org = buildOrganization({ exportFormats: ['csv'] });
      mockUseAuth.mockReturnValue({ organization: org });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.canExport('pdf')).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // remainingScans
  // ────────────────────────────────────────────────────────────────
  describe('remainingScans', () => {
    it('returns correct remaining count', () => {
      const org = buildOrganization({ maxScansPerMonth: 10 });
      mockUseAuth.mockReturnValue({ organization: org });
      mockGetMonthlyUsage.mockReturnValue({ scans: 3, aiFixes: 0, prs: 0, month: currentMonth() });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.remainingScans).toBe(7);
    });

    it('returns 0 when usage exceeds limit (never negative)', () => {
      const org = buildOrganization({ maxScansPerMonth: 5 });
      mockUseAuth.mockReturnValue({ organization: org });
      mockGetMonthlyUsage.mockReturnValue({ scans: 8, aiFixes: 0, prs: 0, month: currentMonth() });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.remainingScans).toBe(0);
    });

    it('returns Infinity for unlimited plans', () => {
      const org = buildOrganization({ maxScansPerMonth: -1 }, 'pro');
      mockUseAuth.mockReturnValue({ organization: org });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.remainingScans).toBe(Infinity);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // incrementScanCount
  // ────────────────────────────────────────────────────────────────
  describe('incrementScanCount', () => {
    it('calls incrementUsage with scans', () => {
      const org = buildOrganization();
      mockUseAuth.mockReturnValue({ organization: org });

      const { result } = renderHook(() => usePlanLimits());

      act(() => {
        result.current.incrementScanCount();
      });

      expect(mockIncrementUsage).toHaveBeenCalledWith('scans');
    });
  });
});
