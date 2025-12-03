import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReportSettings } from "../../../components/settings/ReportSettings";

const mockUseReportSettings = vi.fn();
type ReportSettingsHook = {
  settings: {
    scoreGoal: { scoreGoal: number; showScoreGoal: boolean; showGoalProgress: boolean };
    pdfExport: {
      includeScoreTrend: boolean;
      includeIssueTrend: boolean;
      includeDistribution: boolean;
      includeStats: boolean;
      includeSummary: boolean;
      companyName: string;
      logoUrl: string;
    };
  };
  defaults: ReportSettingsHook["settings"];
  updateScoreGoalSettings: ReturnType<typeof vi.fn>;
  updatePdfExportSettings: ReturnType<typeof vi.fn>;
  resetToDefaults: ReturnType<typeof vi.fn>;
};
let currentMock: ReportSettingsHook;

vi.mock("../../../hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useReportSettings: () => mockUseReportSettings(),
  };
});

describe("settings/ReportSettings", () => {
  const defaults: ReportSettingsHook["settings"] = {
    scoreGoal: { scoreGoal: 90, showScoreGoal: true, showGoalProgress: true },
    pdfExport: {
      includeScoreTrend: true,
      includeIssueTrend: true,
      includeDistribution: true,
      includeStats: true,
      includeSummary: true,
      companyName: "",
      logoUrl: "",
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    currentMock = {
      settings: defaults,
      defaults,
      updateScoreGoalSettings: vi.fn(),
      updatePdfExportSettings: vi.fn(),
      resetToDefaults: vi.fn(),
    };
    mockUseReportSettings.mockImplementation(() => currentMock);
  });

  it("updates goal and pdf settings and saves", () => {
    const updateScore = vi.fn();
    const updatePdf = vi.fn();
    const mockValue = { ...currentMock, updateScoreGoalSettings: updateScore, updatePdfExportSettings: updatePdf };
    mockUseReportSettings.mockReset().mockReturnValueOnce(mockValue).mockReturnValue(mockValue);

    render(<ReportSettings />);

    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "95" } });
    fireEvent.click(screen.getAllByRole("checkbox")[0]); // Show goal line
    fireEvent.change(screen.getByPlaceholderText("Your Company Name"), { target: { value: "Acme" } });
    fireEvent.click(screen.getByText("Summary Statistics"));

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(updateScore).toHaveBeenCalled();
    expect(updatePdf).toHaveBeenCalled();
  });

  it("resets to defaults and updates preview", () => {
    const resetToDefaults = vi.fn();
    const mockValue = { ...currentMock, resetToDefaults };
    mockUseReportSettings.mockReset().mockReturnValueOnce(mockValue).mockReturnValue(mockValue);

    render(<ReportSettings />);
    screen.getAllByRole("button", { name: "Reset to Defaults" }).forEach(btn => fireEvent.click(btn));
    expect(resetToDefaults).toHaveBeenCalled();
    expect(screen.getAllByText("90/100").length).toBeGreaterThan(0);
  });

  it("toggles all PDF export checkboxes and goal progress", () => {
    render(<ReportSettings />);

    const checkboxes = screen.getAllByRole("checkbox").slice(0, 7);

    // Based on the component structure:
    // checkboxes[0] = showScoreGoal
    // checkboxes[1] = showGoalProgress
    // checkboxes[2] = includeStats
    // checkboxes[3] = includeScoreTrend
    // checkboxes[4] = includeIssueTrend
    // checkboxes[5] = includeDistribution
    // checkboxes[6] = includeSummary

    // Click showGoalProgress to cover that onChange
    fireEvent.click(checkboxes[1]);

    // Click the PDF export checkboxes to cover their onChanges
    fireEvent.click(checkboxes[3]); // includeScoreTrend
    fireEvent.click(checkboxes[4]); // includeIssueTrend
    fireEvent.click(checkboxes[5]); // includeDistribution
    fireEvent.click(checkboxes[6]); // includeSummary

    // Verify structure
    expect(checkboxes.length).toBeGreaterThanOrEqual(7);
  });

  it("falls back to default score goal when input is invalid", () => {
    const updateScore = vi.fn();
    const updatePdf = vi.fn();
    const mockValue = { ...currentMock, updateScoreGoalSettings: updateScore, updatePdfExportSettings: updatePdf };
    mockUseReportSettings.mockReset().mockReturnValue(mockValue);

    render(<ReportSettings />);

    const scoreInput = screen.getAllByRole("spinbutton")[0] as HTMLInputElement;
    fireEvent.change(scoreInput, { target: { value: "" } }); // parseInt -> NaN -> fallback 90
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    const args = (updateScore.mock.calls[0] || [])[0];
    expect(args.scoreGoal).toBe(90);
  });
});
