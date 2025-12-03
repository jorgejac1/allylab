import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Tabs } from "../../../components/ui/Tabs";

describe("ui/Tabs", () => {
  afterEach(cleanup);

  const tabs = [
    { id: "a", label: "Tab A", count: 3 },
    { id: "b", label: "Tab B" },
  ];

  it("renders tabs and counts", () => {
    render(<Tabs tabs={tabs} activeTab="a" onChange={vi.fn()} />);
    expect(screen.getByText("Tab A")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByText("Tab B")).toBeInTheDocument();
  });

  it("invokes onChange when clicking inactive tab", () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="a" onChange={onChange} />);
    fireEvent.click(screen.getByText("Tab B"));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("applies inactive styles for non-active tab and pill", () => {
    render(<Tabs tabs={tabs} activeTab="b" onChange={vi.fn()} />);
    const inactive = screen.getByText("Tab A");
    expect(inactive).toHaveStyle({ color: "#64748b" });
    const count = screen.getByText("3");
    expect(count).toHaveStyle({ background: "#e2e8f0" });
  });
});
