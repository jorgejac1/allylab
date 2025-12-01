import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const makeStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear() {
      store = {};
    },
  } as unknown as Storage;
};

describe("hooks/useLocalStorage", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = makeStorage();
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    Object.defineProperty(globalThis, "window", { value: { addEventListener: vi.fn(), removeEventListener: vi.fn() }, configurable: true });
    vi.clearAllMocks();
  });

  it("reads initial value and writes to localStorage", () => {
    (localStorage.setItem as Mock).mockImplementationOnce(() => {});
    (localStorage.getItem as Mock).mockReturnValueOnce(JSON.stringify(5));
    const { result } = renderHook(() => useLocalStorage("k", 1));

    expect(result.current[0]).toBe(5);

    act(() => result.current[1](10));
    expect(localStorage.setItem).toHaveBeenCalledWith("k", "10");
    expect(result.current[0]).toBe(10);
  });

  it("handles parse errors and setItem errors gracefully", () => {
    (localStorage.getItem as Mock).mockImplementationOnce(() => {
      throw new Error("fail");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useLocalStorage("broken", 7));
    expect(result.current[0]).toBe(7);

    (localStorage.setItem as Mock).mockImplementation(() => {
      throw new Error("save fail");
    });
    act(() => {
      try {
        result.current[1](2);
      } catch {
        // swallow to let hook catch path count
      }
    });
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  it("updates value on storage event from another tab", () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    Object.defineProperty(globalThis, "window", { value: { addEventListener: addListener, removeEventListener: removeListener }, configurable: true });

    const { result, unmount } = renderHook(() => useLocalStorage("shared", 1));
    const handler = (addListener.mock.calls[0][1] as (e: StorageEvent) => void);
    act(() => handler({ key: "shared", newValue: JSON.stringify(9) } as StorageEvent));
    expect(result.current[0]).toBe(9);

    // malformed JSON should be ignored
    act(() => handler({ key: "shared", newValue: "not-json" } as StorageEvent));
    expect(result.current[0]).toBe(9);

    // wrong key should be ignored
    act(() => handler({ key: "other", newValue: JSON.stringify(5) } as StorageEvent));
    expect(result.current[0]).toBe(9);

    unmount();
    expect(removeListener).toHaveBeenCalled();
  });
});
