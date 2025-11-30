import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { ReportsPage } from "../../pages/ReportsPage";
import { mockUseScans } from "../__mocks__/hooks";

vi.mock("../../components/layout", () => import("../__mocks__/pageComponents"));
vi.mock("../../components/reports", () => import("../__mocks__/pageComponents"));
vi.mock("../../hooks", () => import("../__mocks__/hooks"));

describe("pages/ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes scan data and regression info to reports view", () => {
    mockUseScans.mockReturnValueOnce({
      scans: [{ id: "s1" }],
      removeScan: vi.fn(),
      getRecentRegressions: vi.fn().mockReturnValue(["reg"]),
      hasRegression: true,
      addScan: vi.fn(),
    });

    render(<ReportsPage />);

    const view = screen.getByTestId("reports-view");
    expect(view).toHaveAttribute("data-scan-count", "1");
    expect(view).toHaveAttribute("data-regression-count", "1");
    expect(view).toHaveAttribute("data-has-regression", "true");
  });
});
