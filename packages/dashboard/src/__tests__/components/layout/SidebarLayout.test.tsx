// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SidebarLayout } from "../../../components/layout/SidebarLayout";

vi.mock("../../../components/layout/Sidebar", () => ({
  Sidebar: ({
    activeItem,
    onItemClick,
    collapsed,
    apiStatus,
  }: {
    groups: unknown[];
    activeItem: string;
    onItemClick: (id: string) => void;
    collapsed?: boolean;
    apiStatus?: string;
  }) => (
    <div data-testid="sidebar">
      <span data-testid="active-item">{activeItem}</span>
      <span data-testid="collapsed">{String(collapsed)}</span>
      <span data-testid="api-status">{apiStatus}</span>
      <button onClick={() => onItemClick("test-item")}>Nav Item</button>
    </div>
  ),
}));

describe("layout/SidebarLayout", () => {
  const groups = [
    {
      title: "Main",
      items: [
        { id: "scan", label: "Scan", icon: "🔍" },
        { id: "history", label: "History", icon: "📊" },
      ],
    },
  ];

  it("renders Sidebar with all props", () => {
    const onItemClick = vi.fn();

    render(
      <SidebarLayout
        groups={groups}
        activeItem="scan"
        onItemClick={onItemClick}
        sidebarCollapsed={false}
        apiStatus="connected"
      >
        <div>Content</div>
      </SidebarLayout>
    );

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("active-item")).toHaveTextContent("scan");
    expect(screen.getByTestId("collapsed")).toHaveTextContent("false");
    expect(screen.getByTestId("api-status")).toHaveTextContent("connected");
  });

  it("renders children content", () => {
    render(
      <SidebarLayout
        groups={groups}
        activeItem="scan"
        onItemClick={vi.fn()}
      >
        <div>Page Content</div>
      </SidebarLayout>
    );

    expect(screen.getByText("Page Content")).toBeInTheDocument();
  });

  it("passes onItemClick to Sidebar", () => {
    const onItemClick = vi.fn();

    render(
      <SidebarLayout
        groups={groups}
        activeItem="scan"
        onItemClick={onItemClick}
      >
        <div>Content</div>
      </SidebarLayout>
    );

    const navButton = screen.getByText("Nav Item");
    navButton.click();

    expect(onItemClick).toHaveBeenCalledWith("test-item");
  });

  it("renders with collapsed sidebar", () => {
    render(
      <SidebarLayout
        groups={groups}
        activeItem="history"
        onItemClick={vi.fn()}
        sidebarCollapsed={true}
      >
        <div>Content</div>
      </SidebarLayout>
    );

    expect(screen.getByTestId("collapsed")).toHaveTextContent("true");
  });

  it("renders with disconnected API status", () => {
    render(
      <SidebarLayout
        groups={groups}
        activeItem="scan"
        onItemClick={vi.fn()}
        apiStatus="disconnected"
      >
        <div>Content</div>
      </SidebarLayout>
    );

    expect(screen.getByTestId("api-status")).toHaveTextContent("disconnected");
  });

  it("renders with checking API status", () => {
    render(
      <SidebarLayout
        groups={groups}
        activeItem="scan"
        onItemClick={vi.fn()}
        apiStatus="checking"
      >
        <div>Content</div>
      </SidebarLayout>
    );

    expect(screen.getByTestId("api-status")).toHaveTextContent("checking");
  });

  it("renders without optional props", () => {
    render(
      <SidebarLayout
        groups={groups}
        activeItem="scan"
        onItemClick={vi.fn()}
      >
        <div>Content</div>
      </SidebarLayout>
    );

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
