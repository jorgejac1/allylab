import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

type GlobalWithOptionalWindow = typeof globalThis & { window?: Window & typeof globalThis };
const globalWithWindow = globalThis as GlobalWithOptionalWindow;
if (!globalWithWindow.window) {
  globalWithWindow.window = globalThis as Window & typeof globalThis;
}
const makeStorage = () =>
  ({
    getItem: vi.fn(),
    setItem: vi.fn(),
  } as unknown as Storage);

import { DEFAULT_ALERT_SETTINGS, loadAlertSettings, saveAlertSettings } from "../../utils/alertSettings";
import type { AlertSettings } from "../../types";

describe("utils/alertSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const storage = makeStorage();
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    if (!globalWithWindow.window) globalWithWindow.window = globalThis as Window & typeof globalThis;
    Object.defineProperty(globalWithWindow.window, "localStorage", { value: storage, configurable: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns defaults when nothing stored", () => {
    (window.localStorage.getItem as Mock).mockReturnValue(null);
    expect(loadAlertSettings()).toEqual(DEFAULT_ALERT_SETTINGS);
  });

  it("merges stored settings", () => {
    const stored: AlertSettings = { regressionThreshold: 10, recentDays: 3, showRegressionAlerts: false };
    (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify(stored));
    expect(loadAlertSettings()).toEqual({ ...DEFAULT_ALERT_SETTINGS, ...stored });
  });

  it("handles load errors gracefully", () => {
    (window.localStorage.getItem as Mock).mockImplementation(() => {
      throw new Error("fail");
    });
    expect(loadAlertSettings()).toEqual(DEFAULT_ALERT_SETTINGS);
    expect(console.error).toHaveBeenCalled();
  });

  it("saves settings and swallows errors", () => {
    const settings: AlertSettings = { regressionThreshold: 8, recentDays: 5, showRegressionAlerts: true };
    saveAlertSettings(settings);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(expect.any(String), JSON.stringify(settings));

    (window.localStorage.setItem as Mock).mockImplementation(() => {
      throw new Error("fail");
    });
    saveAlertSettings(settings);
    expect(console.error).toHaveBeenCalled();
  });
});
