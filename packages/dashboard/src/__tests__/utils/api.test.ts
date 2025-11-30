import { describe, expect, it, vi } from "vitest";
import { getApiBase } from "../../utils/api";

type GlobalWithOptionalWindow = typeof globalThis & { window?: Window & typeof globalThis };

describe("utils/api", () => {
  it("returns default when window undefined", () => {
    const globalWithWindow = globalThis as GlobalWithOptionalWindow;
    const realWindow = globalWithWindow.window;
    // Temporarily simulate server environment
    globalWithWindow.window = undefined as unknown as Window & typeof globalThis;
    expect(getApiBase()).toBe("http://localhost:3001");
    globalWithWindow.window = realWindow;
  });

  it("returns stored value when present", () => {
    const globalWithWindow = globalThis as GlobalWithOptionalWindow;
    if (!globalWithWindow.window) globalWithWindow.window = globalThis as Window & typeof globalThis;
    const storage = {
      getItem: vi.fn().mockReturnValue("http://api"),
    } as unknown as Storage;
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    Object.defineProperty(globalWithWindow.window, "localStorage", { value: storage, configurable: true });
    expect(getApiBase()).toBe("http://api");
  });

  it("falls back to default when no stored value", () => {
    const globalWithWindow = globalThis as GlobalWithOptionalWindow;
    if (!globalWithWindow.window) globalWithWindow.window = globalThis as Window & typeof globalThis;
    const storage = {
      getItem: vi.fn().mockReturnValue(null),
    } as unknown as Storage;
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    Object.defineProperty(globalWithWindow.window, "localStorage", { value: storage, configurable: true });
    expect(getApiBase()).toBe("http://localhost:3001");
  });
});
