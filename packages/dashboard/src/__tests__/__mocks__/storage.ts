import { vi } from "vitest";

export const mockGetScansForUrl = vi.fn();

export function getScansForUrl(url: string) {
  return mockGetScansForUrl(url);
}
