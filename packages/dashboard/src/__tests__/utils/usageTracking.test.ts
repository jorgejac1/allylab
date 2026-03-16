import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// Mock STORAGE_KEYS before importing the module under test
vi.mock('../../config', () => ({
  STORAGE_KEYS: {
    USAGE_TRACKING: 'allylab_usage_tracking',
  },
}));

const makeStorage = (): Storage =>
  ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  } as unknown as Storage);

import { getMonthlyUsage, incrementUsage, resetMonthlyCounters } from '../../utils/usageTracking';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

describe('utils/usageTracking', () => {
  let storage: Storage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = makeStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  });

  // ────────────────────────────────────────────────────────────────
  // getMonthlyUsage
  // ────────────────────────────────────────────────────────────────
  describe('getMonthlyUsage()', () => {
    it('returns default values when localStorage is empty', () => {
      (storage.getItem as Mock).mockReturnValue(null);

      const usage = getMonthlyUsage();

      expect(usage).toEqual({
        scans: 0,
        aiFixes: 0,
        prs: 0,
        month: currentMonth(),
      });
    });

    it('returns stored values when present', () => {
      const stored = {
        scans: 3,
        aiFixes: 7,
        prs: 1,
        month: currentMonth(),
      };
      (storage.getItem as Mock).mockReturnValue(JSON.stringify(stored));

      const usage = getMonthlyUsage();

      expect(usage).toEqual(stored);
    });

    it('resets counters when month changes', () => {
      const oldData = {
        scans: 10,
        aiFixes: 5,
        prs: 2,
        month: '2020-01', // stale month
      };
      (storage.getItem as Mock).mockReturnValue(JSON.stringify(oldData));

      const usage = getMonthlyUsage();

      expect(usage).toEqual({
        scans: 0,
        aiFixes: 0,
        prs: 0,
        month: currentMonth(),
      });

      // Should persist the reset
      expect(storage.setItem).toHaveBeenCalledWith(
        'allylab_usage_tracking',
        JSON.stringify({ scans: 0, aiFixes: 0, prs: 0, month: currentMonth() }),
      );
    });
  });

  // ────────────────────────────────────────────────────────────────
  // incrementUsage
  // ────────────────────────────────────────────────────────────────
  describe('incrementUsage()', () => {
    it('increments scan count', () => {
      const stored = { scans: 2, aiFixes: 0, prs: 0, month: currentMonth() };
      (storage.getItem as Mock).mockReturnValue(JSON.stringify(stored));

      incrementUsage('scans');

      expect(storage.setItem).toHaveBeenCalledWith(
        'allylab_usage_tracking',
        JSON.stringify({ scans: 3, aiFixes: 0, prs: 0, month: currentMonth() }),
      );
    });

    it('increments aiFixes count', () => {
      const stored = { scans: 0, aiFixes: 4, prs: 0, month: currentMonth() };
      (storage.getItem as Mock).mockReturnValue(JSON.stringify(stored));

      incrementUsage('aiFixes');

      expect(storage.setItem).toHaveBeenCalledWith(
        'allylab_usage_tracking',
        JSON.stringify({ scans: 0, aiFixes: 5, prs: 0, month: currentMonth() }),
      );
    });

    it('increments prs count', () => {
      const stored = { scans: 0, aiFixes: 0, prs: 6, month: currentMonth() };
      (storage.getItem as Mock).mockReturnValue(JSON.stringify(stored));

      incrementUsage('prs');

      expect(storage.setItem).toHaveBeenCalledWith(
        'allylab_usage_tracking',
        JSON.stringify({ scans: 0, aiFixes: 0, prs: 7, month: currentMonth() }),
      );
    });
  });

  // ────────────────────────────────────────────────────────────────
  // resetMonthlyCounters
  // ────────────────────────────────────────────────────────────────
  describe('resetMonthlyCounters()', () => {
    it('resets all counters to zero', () => {
      resetMonthlyCounters();

      expect(storage.setItem).toHaveBeenCalledWith(
        'allylab_usage_tracking',
        JSON.stringify({ scans: 0, aiFixes: 0, prs: 0, month: currentMonth() }),
      );
    });
  });
});
