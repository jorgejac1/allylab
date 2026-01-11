// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TabNav } from "../../../components/layout/TabNav";

describe("layout/TabNav", () => {
  const tabs = [
    { id: "scan", label: "Scan", icon: "🔍" },
    { id: "history", label: "History", icon: "📊", badge: 5 },
    { id: "settings", label: "Settings" },
    { id: "disabled", label: "Disabled", icon: "❌", disabled: true },
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

    expect(screen.getByText("🔍")).toBeInTheDocument();
    expect(screen.getByText("📊")).toBeInTheDocument();
    expect(screen.getByText("❌")).toBeInTheDocument();
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
    expect(historyButton).toHaveStyle({
      background: "#eff6ff",
      borderBottom: "2px solid #2563eb",
      color: "#2563eb",
    });
  });

  it("renders inactive tab with default styling", () => {
    render(<TabNav tabs={tabs} activeTab="scan" onChange={vi.fn()} />);

    const historyButton = screen.getByText("History").closest("button");
    expect(historyButton).toHaveStyle({ color: "rgb(100, 116, 139)" });
  });

  it("renders badges when provided", () => {
    render(<TabNav tabs={tabs} activeTab="scan" onChange={vi.fn()} />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders badge with active styling when tab is active", () => {
    render(<TabNav tabs={tabs} activeTab="history" onChange={vi.fn()} />);

    const badge = screen.getByText("5");
    expect(badge).toHaveStyle({
      background: "#2563eb",
      color: "#fff",
    });
  });

  it("renders badge with inactive styling when tab is inactive", () => {
    render(<TabNav tabs={tabs} activeTab="scan" onChange={vi.fn()} />);

    const badge = screen.getByText("5");
    expect(badge).toHaveStyle({
      background: "#e2e8f0",
      color: "#64748b",
    });
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
    expect(disabledButton).toHaveStyle({
      cursor: "not-allowed",
      color: "#cbd5e1",
      opacity: 0.5,
    });
  });

  it("handles tab without icon or badge", () => {
    render(<TabNav tabs={tabs} activeTab="settings" onChange={vi.fn()} />);

    const settingsButton = screen.getByText("Settings").closest("button");
    expect(settingsButton).toBeInTheDocument();
    expect(settingsButton).toHaveStyle({
      background: "#eff6ff",
      color: "#2563eb",
    });
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
      { id: "tab1", label: "Tab 1", icon: "1️⃣", badge: 10 },
      { id: "tab2", label: "Tab 2", icon: "2️⃣" },
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
