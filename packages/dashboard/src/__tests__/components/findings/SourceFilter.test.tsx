// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SourceFilter } from "../../../components/findings/SourceFilter";

describe("findings/SourceFilter", () => {
  const counts = {
    axeCore: 10,
    customRule: 5,
    total: 15,
  };

  it("renders all filter buttons when custom rules exist", () => {
    render(<SourceFilter value="all" onChange={vi.fn()} counts={counts} />);

    expect(screen.getByText("All (15)")).toBeInTheDocument();
    expect(screen.getByText(/🔍 axe-core \(10\)/)).toBeInTheDocument();
    expect(screen.getByText(/📋 Custom \(5\)/)).toBeInTheDocument();
  });

  it("returns null when no custom rules exist", () => {
    const noCustomCounts = { axeCore: 15, customRule: 0, total: 15 };
    const { container } = render(<SourceFilter value="all" onChange={vi.fn()} counts={noCustomCounts} />);

    expect(container.firstChild).toBeNull();
  });

  it("highlights active filter", () => {
    render(<SourceFilter value="axe-core" onChange={vi.fn()} counts={counts} />);

    const axeCoreButton = screen.getByText(/🔍 axe-core \(10\)/);
    expect(axeCoreButton).toHaveStyle({ color: "rgb(255, 255, 255)" });
  });

  it("calls onChange with correct value when All is clicked", () => {
    const onChange = vi.fn();
    render(<SourceFilter value="axe-core" onChange={onChange} counts={counts} />);

    fireEvent.click(screen.getByText("All (15)"));
    expect(onChange).toHaveBeenCalledWith("all");
  });

  it("calls onChange with correct value when axe-core is clicked", () => {
    const onChange = vi.fn();
    render(<SourceFilter value="all" onChange={onChange} counts={counts} />);

    fireEvent.click(screen.getByText(/🔍 axe-core \(10\)/));
    expect(onChange).toHaveBeenCalledWith("axe-core");
  });

  it("calls onChange with correct value when custom-rule is clicked", () => {
    const onChange = vi.fn();
    render(<SourceFilter value="all" onChange={onChange} counts={counts} />);

    fireEvent.click(screen.getByText(/📋 Custom \(5\)/));
    expect(onChange).toHaveBeenCalledWith("custom-rule");
  });

  it("applies correct styling to active button", () => {
    render(<SourceFilter value="axe-core" onChange={vi.fn()} counts={counts} />);

    const axeCoreButton = screen.getByText(/🔍 axe-core \(10\)/).closest("button");
    expect(axeCoreButton).toHaveStyle({
      background: "#6366f1",
      color: "#fff",
    });
  });

  it("applies correct styling to inactive button", () => {
    render(<SourceFilter value="all" onChange={vi.fn()} counts={counts} />);

    const axeCoreButton = screen.getByText(/🔍 axe-core \(10\)/).closest("button");
    expect(axeCoreButton).toHaveStyle({
      background: "transparent",
      color: "#64748b",
    });
  });

  it("uses custom color for custom-rule button", () => {
    render(<SourceFilter value="custom-rule" onChange={vi.fn()} counts={counts} />);

    const customButton = screen.getByText(/📋 Custom \(5\)/).closest("button");
    expect(customButton).toHaveStyle({
      background: "#0891b2",
      color: "#fff",
    });
  });

  it("uses default color for All button", () => {
    render(<SourceFilter value="all" onChange={vi.fn()} counts={counts} />);

    const allButton = screen.getByText("All (15)").closest("button");
    expect(allButton).toHaveStyle({
      background: "#2563eb",
      color: "#fff",
    });
  });

  it("handles zero custom rule count correctly", () => {
    const zeroCounts = { axeCore: 10, customRule: 0, total: 10 };
    const { container } = render(<SourceFilter value="all" onChange={vi.fn()} counts={zeroCounts} />);

    expect(container.firstChild).toBeNull();
  });

  it("handles case where total equals axe-core", () => {
    const equalCounts = { axeCore: 15, customRule: 0, total: 15 };
    const { container } = render(<SourceFilter value="all" onChange={vi.fn()} counts={equalCounts} />);

    expect(container.firstChild).toBeNull();
  });
});
