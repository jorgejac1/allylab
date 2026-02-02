import { vi } from "vitest";

export const mockGetScansForUrl = vi.fn();
export const mockLoadAllScans = vi.fn().mockReturnValue([]);

export function getScansForUrl(url: string) {
  return mockGetScansForUrl(url);
}

export function loadAllScans() {
  return mockLoadAllScans();
}
