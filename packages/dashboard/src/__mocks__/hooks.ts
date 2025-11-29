import { vi } from 'vitest';
import type { SavedScan } from '../types';
import { createMockSavedScan } from './api';

/**
 * Type for useScans hook return value
 */
interface UseScansReturn {
  scans: SavedScan[];
  addScan: ReturnType<typeof vi.fn>;
  removeScan: ReturnType<typeof vi.fn>;
  getRecentRegressions: ReturnType<typeof vi.fn>;
  hasRegression: ReturnType<typeof vi.fn>;
}

/**
 * Mock useScans hook
 */
export function createMockUseScans(overrides: Partial<UseScansReturn> = {}): UseScansReturn {
  return {
    scans: [createMockSavedScan()],
    addScan: vi.fn(),
    removeScan: vi.fn(),
    getRecentRegressions: vi.fn().mockReturnValue([]),
    hasRegression: vi.fn().mockReturnValue(undefined),
    ...overrides,
  };
}

/**
 * Mock useScan hook
 */
export function createMockUseScan() {
  return {
    scan: null,
    isScanning: false,
    error: null,
    startScan: vi.fn(),
    reset: vi.fn(),
  };
}

/**
 * Mock useGitHub hook
 */
export function createMockUseGitHub() {
  return {
    connection: { connected: false },
    isConnecting: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    repos: [],
    branches: [],
    fetchBranches: vi.fn(),
    createPR: vi.fn(),
  };
}

/**
 * Mock useLocalStorage hook
 */
export function createMockUseLocalStorage<T>(initialValue: T) {
  let value = initialValue;
  const setValue = vi.fn((newValue: T | ((prev: T) => T)) => {
    value = typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue;
  });
  
  return [value, setValue] as const;
}

/**
 * Mock useToast hook
 */
export function createMockUseToast() {
  return {
    toasts: [],
    addToast: vi.fn(),
    removeToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  };
}

/**
 * Mock useCustomRules hook
 */
export function createMockUseCustomRules() {
  return {
    rules: [],
    isLoading: false,
    error: null,
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn(),
    testRule: vi.fn(),
    refresh: vi.fn(),
  };
}