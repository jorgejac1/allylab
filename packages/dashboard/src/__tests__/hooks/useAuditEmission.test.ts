import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Shared audit mock ──────────────────────────────────────────────
const mockAddAuditEntry = vi.hoisted(() => vi.fn());
vi.mock('../../utils/auditLog', () => ({ addAuditEntry: mockAddAuditEntry }));

// ── dashboardLayout mocks ──────────────────────────────────────────
const mockGetDashboardLayout = vi.hoisted(() =>
  vi.fn(() => ({
    widgets: [
      { id: 'kpi-cards', label: 'KPI Cards', enabled: true, position: 0, size: 'full' },
    ],
    updatedAt: new Date().toISOString(),
  })),
);
const mockSaveDashboardLayout = vi.hoisted(() => vi.fn());
const mockResetDashboardLayout = vi.hoisted(() =>
  vi.fn(() => ({
    widgets: [
      { id: 'kpi-cards', label: 'KPI Cards', enabled: true, position: 0, size: 'full' },
    ],
    updatedAt: new Date().toISOString(),
  })),
);

vi.mock('../../utils/dashboardLayout', () => ({
  getDashboardLayout: mockGetDashboardLayout,
  saveDashboardLayout: mockSaveDashboardLayout,
  resetDashboardLayout: mockResetDashboardLayout,
}));

// ── filterPresets mocks ────────────────────────────────────────────
const mockGetPresets = vi.hoisted(() => vi.fn(() => []));
const mockSavePreset = vi.hoisted(() =>
  vi.fn((input: { name: string }) => ({
    id: 'preset_test_123',
    name: input.name,
    filters: {
      severityFilter: 'all',
      statusFilter: 'all',
      sourceFilter: 'all',
      fpFilter: 'active',
    },
    createdAt: new Date().toISOString(),
  })),
);
const mockDeletePreset = vi.hoisted(() => vi.fn());
const mockUpdateLastUsed = vi.hoisted(() => vi.fn());
const mockSetDefaultPreset = vi.hoisted(() => vi.fn());

vi.mock('../../utils/filterPresets', () => ({
  getPresets: mockGetPresets,
  savePreset: mockSavePreset,
  deletePreset: mockDeletePreset,
  updateLastUsed: mockUpdateLastUsed,
  setDefaultPreset: mockSetDefaultPreset,
}));

// ── useSchedules fetch / api mocks ─────────────────────────────────
const mockGetApiBase = vi.hoisted(() => vi.fn(() => 'http://localhost:3001/api'));
vi.mock('../../utils/api', () => ({ getApiBase: mockGetApiBase }));

// ── Imports (after all vi.mock calls) ──────────────────────────────
import { useDashboardLayout } from '../../hooks/useDashboardLayout';
import { useFilterPresets } from '../../hooks/useFilterPresets';
import { useSchedules } from '../../hooks/useSchedules';

// Helper for mock fetch responses
function createMockResponse<T>(ok: boolean, data: T) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(data),
  };
}

describe('hooks/useAuditEmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ────────────────────────────────────────────────────────────────
  // useDashboardLayout
  // ────────────────────────────────────────────────────────────────
  describe('useDashboardLayout audit entries', () => {
    it('saveEdits() calls addAuditEntry with eventType dashboard:customized', () => {
      const { result } = renderHook(() => useDashboardLayout());

      // Must enter editing mode so draft is populated
      act(() => {
        result.current.startEditing();
      });

      act(() => {
        result.current.saveEdits();
      });

      expect(mockAddAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'dashboard:customized' }),
      );
    });

    it('resetToDefaults() calls addAuditEntry with eventType dashboard:customized', () => {
      const { result } = renderHook(() => useDashboardLayout());

      act(() => {
        result.current.resetToDefaults();
      });

      expect(mockAddAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'dashboard:customized' }),
      );
    });
  });

  // ────────────────────────────────────────────────────────────────
  // useFilterPresets
  // ────────────────────────────────────────────────────────────────
  describe('useFilterPresets audit entries', () => {
    it('saveCurrentAsPreset() calls addAuditEntry with eventType preset:saved', () => {
      const { result } = renderHook(() => useFilterPresets());

      act(() => {
        result.current.saveCurrentAsPreset('My Preset');
      });

      expect(mockAddAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'preset:saved' }),
      );
    });

    it('deletePreset() calls addAuditEntry with eventType preset:deleted', () => {
      const { result } = renderHook(() => useFilterPresets());

      act(() => {
        result.current.deletePreset('preset_test_123');
      });

      expect(mockAddAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'preset:deleted' }),
      );
    });
  });

  // ────────────────────────────────────────────────────────────────
  // useSchedules
  // ────────────────────────────────────────────────────────────────
  describe('useSchedules audit entries', () => {
    const mockSchedule = {
      id: 'sched-1',
      url: 'https://example.com',
      frequency: 'daily',
      enabled: true,
      createdAt: new Date().toISOString(),
      nextRun: new Date().toISOString(),
    };

    it('createSchedule() calls addAuditEntry with eventType settings:updated', async () => {
      const fetchMock = vi.fn();
      // Initial load
      fetchMock.mockResolvedValueOnce(createMockResponse(true, { schedules: [] }));
      // createSchedule POST
      fetchMock.mockResolvedValueOnce(createMockResponse(true, mockSchedule));
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createSchedule('https://example.com', 'daily');
      });

      expect(mockAddAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'settings:updated' }),
      );
    });

    it('deleteSchedule() calls addAuditEntry with eventType settings:updated', async () => {
      const fetchMock = vi.fn();
      // Initial load
      fetchMock.mockResolvedValueOnce(
        createMockResponse(true, { schedules: [mockSchedule] }),
      );
      // deleteSchedule DELETE
      fetchMock.mockResolvedValueOnce(createMockResponse(true, {}));
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteSchedule('sched-1');
      });

      expect(mockAddAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'settings:updated' }),
      );
    });
  });
});
