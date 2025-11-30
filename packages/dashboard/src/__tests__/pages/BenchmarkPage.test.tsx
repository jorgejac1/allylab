import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { BenchmarkPage } from "../../pages/BenchmarkPage";
import type { SavedScan } from "../../types";
import { mockUseLocalStorage } from "../__mocks__/hooks";

vi.mock("../../components/layout", () => import("../__mocks__/pageComponents"));
vi.mock("../../components/benchmarking", () => import("../__mocks__/pageComponents"));
vi.mock("../../hooks", () => import("../__mocks__/hooks"));

describe("pages/BenchmarkPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes latest scan data to competitor benchmark", () => {
    const scans: SavedScan[] = [
      { id: "1", url: "https://example.com", score: 92, timestamp: "", totalIssues: 0, critical: 0, serious: 0, moderate: 0, minor: 0, findings: [], scanDuration: 1 },
    ];
    mockUseLocalStorage.mockReturnValueOnce([scans, vi.fn()]);

    render(<BenchmarkPage />);

    const benchmark = screen.getByTestId("competitor-benchmark");
    expect(benchmark).toHaveAttribute("data-url", "https://example.com");
    expect(benchmark).toHaveAttribute("data-score", "92");
  });
});
