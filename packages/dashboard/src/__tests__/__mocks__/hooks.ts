import { vi } from "vitest";
import type { Dispatch, SetStateAction } from "react";

export const mockUseLocalStorage = vi.fn();
export const mockUseScans = vi.fn().mockReturnValue({
  scans: [],
  removeScan: vi.fn(),
  getRecentRegressions: vi.fn().mockReturnValue([]),
  hasRegression: false,
  addScan: vi.fn((scan) => scan),
});
export const mockUseScanSSE = vi.fn().mockReturnValue({
  isScanning: false,
  progress: { percent: 0, message: "", status: "idle" },
  result: null,
  error: null,
  startScan: vi.fn(),
  cancelScan: vi.fn(),
  reset: vi.fn(),
});
export const mockUseConfirmDialog = vi.fn().mockReturnValue({
  isOpen: false,
  options: {
    title: "",
    message: "",
    confirmLabel: "",
    cancelLabel: "",
    variant: "info",
  },
  confirm: vi.fn().mockResolvedValue(false),
  handleConfirm: vi.fn(),
  handleCancel: vi.fn(),
});
export const mockUseToast = vi.fn().mockReturnValue({
  toasts: [],
  success: vi.fn(),
  closeToast: vi.fn(),
});

export function useLocalStorage<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const value = mockUseLocalStorage(key, initial);
  if (value) return value as [T, Dispatch<SetStateAction<T>>];
  return [initial, vi.fn()];
}

export function useScans() {
  return mockUseScans();
}

export function useScanSSE(options?: unknown) {
  return mockUseScanSSE(options);
}

export function useConfirmDialog() {
  return mockUseConfirmDialog();
}

export function useToast() {
  return mockUseToast();
}
