// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FindingsSelectionBar } from "../../../components/findings/FindingsSelectionBar";

describe("findings/FindingsSelectionBar", () => {
  it("returns null when selectedCount is 0", () => {
    const { container } = render(
      <FindingsSelectionBar
        selectedCount={0}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders selection count", () => {
    render(
      <FindingsSelectionBar
        selectedCount={5}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
      />
    );

    expect(screen.getByText("5 selected")).toBeInTheDocument();
  });

  it("renders select all button with total count", () => {
    render(
      <FindingsSelectionBar
        selectedCount={5}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
      />
    );

    expect(screen.getByText("Select all 10")).toBeInTheDocument();
  });

  it("calls onSelectAll when select all button is clicked", () => {
    const onSelectAll = vi.fn();

    render(
      <FindingsSelectionBar
        selectedCount={5}
        totalFilteredCount={10}
        onSelectAll={onSelectAll}
        onClearSelection={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Select all 10"));
    expect(onSelectAll).toHaveBeenCalledTimes(1);
  });

  it("renders clear selection button", () => {
    render(
      <FindingsSelectionBar
        selectedCount={5}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
      />
    );

    expect(screen.getByText("Clear selection")).toBeInTheDocument();
  });

  it("calls onClearSelection when clear button is clicked", () => {
    const onClearSelection = vi.fn();

    render(
      <FindingsSelectionBar
        selectedCount={5}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={onClearSelection}
      />
    );

    fireEvent.click(screen.getByText("Clear selection"));
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  it("renders Create PR button when onCreatePR is provided", () => {
    render(
      <FindingsSelectionBar
        selectedCount={5}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
        onCreatePR={vi.fn()}
      />
    );

    expect(screen.getByText("Create PR")).toBeInTheDocument();
  });

  it("does not render Create PR button when onCreatePR is not provided", () => {
    render(
      <FindingsSelectionBar
        selectedCount={5}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
      />
    );

    expect(screen.queryByText("Create PR")).not.toBeInTheDocument();
  });

  it("calls onCreatePR when Create PR button is clicked", () => {
    const onCreatePR = vi.fn();

    render(
      <FindingsSelectionBar
        selectedCount={5}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
        onCreatePR={onCreatePR}
      />
    );

    fireEvent.click(screen.getByText("Create PR"));
    expect(onCreatePR).toHaveBeenCalledTimes(1);
  });

  it("renders Export to JIRA button when onExportJira is provided", () => {
    render(
      <FindingsSelectionBar
        selectedCount={5}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
        onExportJira={vi.fn()}
      />
    );

    expect(screen.getByText("Export to JIRA")).toBeInTheDocument();
  });

  it("does not render Export to JIRA button when onExportJira is not provided", () => {
    render(
      <FindingsSelectionBar
        selectedCount={5}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
      />
    );

    expect(screen.queryByText("Export to JIRA")).not.toBeInTheDocument();
  });

  it("calls onExportJira when Export to JIRA button is clicked", () => {
    const onExportJira = vi.fn();

    render(
      <FindingsSelectionBar
        selectedCount={5}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
        onExportJira={onExportJira}
      />
    );

    fireEvent.click(screen.getByText("Export to JIRA"));
    expect(onExportJira).toHaveBeenCalledTimes(1);
  });

  it("renders both action buttons when both callbacks are provided", () => {
    render(
      <FindingsSelectionBar
        selectedCount={5}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
        onCreatePR={vi.fn()}
        onExportJira={vi.fn()}
      />
    );

    expect(screen.getByText("Create PR")).toBeInTheDocument();
    expect(screen.getByText("Export to JIRA")).toBeInTheDocument();
  });

  it("renders SVG icon in Create PR button", () => {
    const { container } = render(
      <FindingsSelectionBar
        selectedCount={5}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
        onCreatePR={vi.fn()}
      />
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "14");
    expect(svg).toHaveAttribute("height", "14");
  });

  it("displays correct count when all are selected", () => {
    render(
      <FindingsSelectionBar
        selectedCount={10}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
      />
    );

    expect(screen.getByText("10 selected")).toBeInTheDocument();
  });

  it("displays correct count when only 1 is selected", () => {
    render(
      <FindingsSelectionBar
        selectedCount={1}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
      />
    );

    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });
});
