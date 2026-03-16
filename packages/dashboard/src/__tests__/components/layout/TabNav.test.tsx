// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TabNav } from "../../../components/layout/TabNav";
import { Search, BarChart3, X } from "lucide-react";

describe("layout/TabNav", () => {
  const tabs = [
    { id: "scan", label: "Scan", icon: <Search size={16} data-testid="icon-scan" /> },
    { id: "history", label: "History", icon: <BarChart3 size={16} data-testid="icon-history" />, badge: 5 },
    { id: "settings", label: "Settings" },
    { id: "disabled", label: "Disabled", icon: <X size={16} data-testid="icon-disabled" />, disabled: true },
  ];

  it("renders all tabs with labels", () => {
    render(<TabNav tabs={tabs} activeTab="scan" onChange={vi.fn()} />);

    expect(screen.getByText("Scan")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("renders tab icons when provided", () => {
    render(<TabNav tabs={tabs} activeTab="scan" onChange={vi.fn()} />);

    expect(screen.getByTestId("icon-scan")).toBeInTheDocument();
    expect(screen.getByTestId("icon-history")).toBeInTheDocument();
    expect(screen.getByTestId("icon-disabled")).toBeInTheDocument();
  });

  it("does not render icon when not provided", () => {
    const tabsNoIcon = [{ id: "settings", label: "Settings" }];
    render(<TabNav tabs={tabsNoIcon} activeTab="settings" onChange={vi.fn()} />);

    const settingsButton = screen.getByText("Settings").closest("button");
    expect(settingsButton?.textContent).toBe("Settings");
  });

  it("highlights active tab with correct styling", () => {
    render(<TabNav tabs={tabs} activeTab="history" onChange={vi.fn()} />);

    const historyButton = screen.getByText("History").closest("button");
    expect(historyButton).toHaveClass("bg-blue-50", "border-blue-600", "text-blue-600");
  });

  it("renders inactive tab with default styling", () => {
    render(<TabNav tabs={tabs} activeTab="scan" onChange={vi.fn()} />);

    const historyButton = screen.getByText("History").closest("button");
    expect(historyButton).toHaveClass("text-slate-500");
  });

  it("renders badges when provided", () => {
    render(<TabNav tabs={tabs} activeTab="scan" onChange={vi.fn()} />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders badge with active styling when tab is active", () => {
    render(<TabNav tabs={tabs} activeTab="history" onChange={vi.fn()} />);

    const badge = screen.getByText("5");
    expect(badge).toHaveClass("bg-blue-600", "text-white");
  });

  it("renders badge with inactive styling when tab is inactive", () => {
    render(<TabNav tabs={tabs} activeTab="scan" onChange={vi.fn()} />);

    const badge = screen.getByText("5");
    expect(badge).toHaveClass("bg-slate-200", "text-slate-500");
  });

  it("does not render badge when not provided", () => {
    const tabsNoBadge = [{ id: "scan", label: "Scan" }];
    render(<TabNav tabs={tabsNoBadge} activeTab="scan" onChange={vi.fn()} />);

    const scanButton = screen.getByText("Scan").closest("button");
    expect(scanButton?.querySelector("span")).toBeNull();
  });

  it("calls onChange when non-disabled tab is clicked", () => {
    const onChange = vi.fn();
    render(<TabNav tabs={tabs} activeTab="scan" onChange={onChange} />);

    const historyButton = screen.getByText("History").closest("button");
    fireEvent.click(historyButton!);

    expect(onChange).toHaveBeenCalledWith("history");
  });

  it("does not call onChange when disabled tab is clicked", () => {
    const onChange = vi.fn();
    render(<TabNav tabs={tabs} activeTab="scan" onChange={onChange} />);

    const disabledButton = screen.getByText("Disabled").closest("button");
    fireEvent.click(disabledButton!);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders disabled tab with disabled styling", () => {
    render(<TabNav tabs={tabs} activeTab="scan" onChange={vi.fn()} />);

    const disabledButton = screen.getByText("Disabled").closest("button");
    expect(disabledButton).toHaveAttribute("disabled");
    expect(disabledButton).toHaveClass("cursor-not-allowed", "text-slate-300", "opacity-50");
  });

  it("handles tab without icon or badge", () => {
    render(<TabNav tabs={tabs} activeTab="settings" onChange={vi.fn()} />);

    const settingsButton = screen.getByText("Settings").closest("button");
    expect(settingsButton).toBeInTheDocument();
    expect(settingsButton).toHaveClass("bg-blue-50", "text-blue-600");
  });

  it("calls onChange with correct tab id", () => {
    const onChange = vi.fn();
    render(<TabNav tabs={tabs} activeTab="scan" onChange={onChange} />);

    const settingsButton = screen.getByText("Settings").closest("button");
    fireEvent.click(settingsButton!);

    expect(onChange).toHaveBeenCalledWith("settings");
  });

  it("renders multiple tabs with various combinations of props", () => {
    const complexTabs = [
      { id: "tab1", label: "Tab 1", icon: <Search size={16} data-testid="icon-tab1" />, badge: 10 },
      { id: "tab2", label: "Tab 2", icon: <BarChart3 size={16} data-testid="icon-tab2" /> },
      { id: "tab3", label: "Tab 3", badge: 99 },
      { id: "tab4", label: "Tab 4" },
    ];

    render(<TabNav tabs={complexTabs} activeTab="tab1" onChange={vi.fn()} />);

    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
    expect(screen.getByText("Tab 3")).toBeInTheDocument();
    expect(screen.getByText("Tab 4")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("99")).toBeInTheDocument();
  });
});
