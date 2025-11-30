import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ExecutivePage } from "../../pages/ExecutivePage";

vi.mock("../../components/layout", () => import("../__mocks__/pageComponents"));
vi.mock("../../components/executive", () => import("../__mocks__/pageComponents"));

describe("pages/ExecutivePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard and forwards drilldown handler", () => {
    const onDrillDown = vi.fn();

    render(<ExecutivePage onDrillDown={onDrillDown} />);

    fireEvent.click(screen.getByTestId("executive-dashboard"));
    expect(onDrillDown).toHaveBeenCalledWith({ target: "drill" });
    expect(screen.getByTestId("page-title")).toHaveTextContent("Executive Dashboard");
  });
});
