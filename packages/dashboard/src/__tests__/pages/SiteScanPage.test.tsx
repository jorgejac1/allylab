import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SiteScanPage } from "../../pages/SiteScanPage";

vi.mock("../../components/layout", () => import("../__mocks__/pageComponents"));
vi.mock("../../components/scanner/SiteScanner", () => import("../__mocks__/pageComponents"));

describe("pages/SiteScanPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders site scanner inside page container", () => {
    render(<SiteScanPage />);

    expect(screen.getByTestId("page-title")).toHaveTextContent("Site Scan");
    expect(screen.getByTestId("site-scanner")).toBeInTheDocument();
  });
});
