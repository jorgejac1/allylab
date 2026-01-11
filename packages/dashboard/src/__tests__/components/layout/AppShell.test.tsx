// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AppShell } from "../../../components/layout/AppShell";
import type { Tab } from "../../../components/layout/TabNav";

vi.mock("../../../components/layout/Header", () => ({
  Header: ({ apiStatus }: { apiStatus: string }) => (
    <div data-testid="header">
      <span data-testid="api-status">{apiStatus}</span>
    </div>
  ),
}));

vi.mock("../../../components/layout/TabNav", () => ({
  TabNav: ({ tabs, activeTab, onChange }: { tabs: Tab[]; activeTab: string; onChange: (id: string) => void }) => (
    <div data-testid="tab-nav">
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)} data-active={activeTab === tab.id}>
          {tab.label}
        </button>
      ))}
    </div>
  ),
}));

describe("layout/AppShell", () => {
  const tabs: Tab[] = [
    { id: "scan", label: "Scan", icon: "🔍" },
    { id: "history", label: "History", icon: "📊" },
  ];

  it("renders Header and TabNav with all props", () => {
    const onTabChange = vi.fn();

    render(
      <AppShell
        tabs={tabs}
        activeTab="scan"
        onTabChange={onTabChange}
        apiStatus="connected"
      >
        <div>Content</div>
      </AppShell>
    );

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("api-status")).toHaveTextContent("connected");
    expect(screen.getByTestId("tab-nav")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders with disconnected API status", () => {
    render(
      <AppShell
        tabs={tabs}
        activeTab="history"
        onTabChange={vi.fn()}
        apiStatus="disconnected"
      >
        <div>Content</div>
      </AppShell>
    );

    expect(screen.getByTestId("api-status")).toHaveTextContent("disconnected");
  });

  it("renders with checking API status", () => {
    render(
      <AppShell
        tabs={tabs}
        activeTab="scan"
        onTabChange={vi.fn()}
        apiStatus="checking"
      >
        <div>Content</div>
      </AppShell>
    );

    expect(screen.getByTestId("api-status")).toHaveTextContent("checking");
  });

  it("passes activeTab to TabNav", () => {
    render(
      <AppShell
        tabs={tabs}
        activeTab="history"
        onTabChange={vi.fn()}
        apiStatus="connected"
      >
        <div>Content</div>
      </AppShell>
    );

    const historyButton = screen.getByText("History");
    expect(historyButton).toHaveAttribute("data-active", "true");
  });

  it("calls onTabChange when tab is clicked", () => {
    const onTabChange = vi.fn();

    render(
      <AppShell
        tabs={tabs}
        activeTab="scan"
        onTabChange={onTabChange}
        apiStatus="connected"
      >
        <div>Content</div>
      </AppShell>
    );

    const historyButton = screen.getByText("History");
    historyButton.click();
    expect(onTabChange).toHaveBeenCalledWith("history");
  });
});
