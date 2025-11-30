import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { DEFAULT_REPORT_SETTINGS, loadReportSettings, saveReportSettings } from "../../utils/reportSettings";
import type { ReportSettings } from "../../types";

type GlobalWithOptionalWindow = typeof globalThis & { window?: Window & typeof globalThis };
const globalWithWindow = globalThis as GlobalWithOptionalWindow;
if (!globalWithWindow.window) globalWithWindow.window = globalThis as Window & typeof globalThis;
const makeStorage = () =>
  ({
    getItem: vi.fn(),
    setItem: vi.fn(),
  } as unknown as Storage);

describe("utils/reportSettings", () => {
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
    expect(loadReportSettings()).toEqual(DEFAULT_REPORT_SETTINGS);
  });

  it("merges stored settings", () => {
    const stored: ReportSettings = {
      scoreGoal: { scoreGoal: 95, showScoreGoal: false, showGoalProgress: false },
      pdfExport: { ...DEFAULT_REPORT_SETTINGS.pdfExport, includeStats: false, companyName: "Acme", logoUrl: "logo.png" },
    };
    (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify(stored));
    expect(loadReportSettings()).toEqual({
      scoreGoal: { ...DEFAULT_REPORT_SETTINGS.scoreGoal, ...stored.scoreGoal },
      pdfExport: { ...DEFAULT_REPORT_SETTINGS.pdfExport, ...stored.pdfExport },
    });
  });

  it("handles load/save errors gracefully", () => {
    (window.localStorage.getItem as Mock).mockImplementation(() => {
      throw new Error("fail");
    });
    expect(loadReportSettings()).toEqual(DEFAULT_REPORT_SETTINGS);
    (window.localStorage.setItem as Mock).mockImplementation(() => {
      throw new Error("fail");
    });
    saveReportSettings(DEFAULT_REPORT_SETTINGS);
    expect(console.error).toHaveBeenCalled();
  });
});
