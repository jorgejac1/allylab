import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useReportSettings } from "../../hooks/useReportSettings";
import * as reportModule from "../../utils/reportSettings";
import type { ReportSettings } from "../../types";

describe("hooks/useReportSettings", () => {
  const initial: ReportSettings = {
    scoreGoal: { scoreGoal: 90, showScoreGoal: true, showGoalProgress: true },
    pdfExport: {
      includeScoreTrend: true,
      includeIssueTrend: true,
      includeDistribution: true,
      includeStats: true,
      includeSummary: true,
      companyName: "Acme",
      logoUrl: "",
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(reportModule, "loadReportSettings").mockReturnValue(initial);
    vi.spyOn(reportModule, "saveReportSettings").mockImplementation(() => {});
  });

  it("loads settings and updates score goal", () => {
    const { result } = renderHook(() => useReportSettings());
    expect(result.current.settings).toEqual(initial);

    act(() => {
      result.current.updateScoreGoalSettings({ scoreGoal: 80, showScoreGoal: false, showGoalProgress: false });
    });

    expect(result.current.settings.scoreGoal.scoreGoal).toBe(80);
    expect(result.current.settings.scoreGoal.showScoreGoal).toBe(false);
    expect(result.current.settings.scoreGoal.showGoalProgress).toBe(false);
    expect(reportModule.saveReportSettings).toHaveBeenCalledWith(
      expect.objectContaining({ scoreGoal: { scoreGoal: 80, showScoreGoal: false, showGoalProgress: false } })
    );
  });

  it("updates pdf export and resets defaults", () => {
    const defaults = { ...reportModule.DEFAULT_REPORT_SETTINGS };
    const saveSpy = vi.spyOn(reportModule, "saveReportSettings");
    const { result } = renderHook(() => useReportSettings());

    act(() => {
      result.current.updatePdfExportSettings({ companyName: "NewCo", includeStats: false, includeSummary: false });
    });
    expect(result.current.settings.pdfExport.companyName).toBe("NewCo");
    expect(result.current.settings.pdfExport.includeStats).toBe(false);
    expect(result.current.settings.pdfExport.includeSummary).toBe(false);

    act(() => {
      result.current.resetToDefaults();
    });
    expect(result.current.settings).toEqual(defaults);
    expect(saveSpy).toHaveBeenCalledWith(defaults);
  });
});
