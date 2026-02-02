// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Sidebar } from "../../../components/layout/Sidebar";
import { Search, BarChart3, Settings, X } from "lucide-react";

describe("layout/Sidebar", () => {
  const groups = [
    {
      title: "Main",
      items: [
        { id: "scan", label: "Scan", icon: <Search size={18} data-testid="icon-scan" /> },
        { id: "history", label: "History", icon: <BarChart3 size={18} data-testid="icon-history" />, badge: 5 },
      ],
    },
    {
      items: [
        { id: "settings", label: "Settings", icon: <Settings size={18} data-testid="icon-settings" /> },
        { id: "disabled", label: "Disabled", icon: <X size={18} data-testid="icon-disabled" />, disabled: true },
      ],
    },
  ];

  it("renders logo and app name when not collapsed", () => {
    const { container } = render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} />);

    // Logo is now a lucide-react Microscope icon (SVG)
    const logoSvg = container.querySelector("svg.lucide-microscope");
    expect(logoSvg).toBeInTheDocument();
    expect(screen.getByText("AllyLab")).toBeInTheDocument();
    expect(screen.getByText("Accessibility Scanner")).toBeInTheDocument();
  });

  it("hides app name when collapsed", () => {
    const { container } = render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} collapsed={true} />);

    // Logo is now a lucide-react Microscope icon (SVG)
    const logoSvg = container.querySelector("svg.lucide-microscope");
    expect(logoSvg).toBeInTheDocument();
    expect(screen.queryByText("AllyLab")).not.toBeInTheDocument();
    expect(screen.queryByText("Accessibility Scanner")).not.toBeInTheDocument();
  });

  it("renders group title when not collapsed", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} />);

    expect(screen.getByText("Main")).toBeInTheDocument();
  });

  it("hides group title when collapsed", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} collapsed={true} />);

    expect(screen.queryByText("Main")).not.toBeInTheDocument();
  });

  it("renders all nav items with icons and labels", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} />);

    expect(screen.getByText("Scan")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("highlights active item", () => {
    render(<Sidebar groups={groups} activeItem="history" onItemClick={vi.fn()} />);

    const historyButton = screen.getByText("History").closest("button");
    expect(historyButton).toHaveStyle({ background: "#1e293b", fontWeight: 600 });
  });

  it("renders badges when provided", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("hides badges when collapsed", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} collapsed={true} />);

    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("calls onItemClick when non-disabled item is clicked", () => {
    const onItemClick = vi.fn();
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={onItemClick} />);

    const historyButton = screen.getByText("History").closest("button");
    fireEvent.click(historyButton!);

    expect(onItemClick).toHaveBeenCalledWith("history");
  });

  it("does not call onItemClick when disabled item is clicked", () => {
    const onItemClick = vi.fn();
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={onItemClick} />);

    const disabledButton = screen.getByText("Disabled").closest("button");
    fireEvent.click(disabledButton!);

    expect(onItemClick).not.toHaveBeenCalled();
  });

  it("renders disabled item with disabled styling", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} />);

    const disabledButton = screen.getByText("Disabled").closest("button");
    expect(disabledButton).toHaveAttribute("disabled");
    expect(disabledButton).toHaveStyle({
      cursor: "not-allowed",
      color: "#475569",
      opacity: 0.5,
    });
  });

  it("renders footer when provided", () => {
    const footer = <div>Footer Content</div>;
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} footer={footer} />);

    expect(screen.getByText("Footer Content")).toBeInTheDocument();
  });

  it("does not render footer when not provided", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} />);

    expect(screen.queryByText("Footer Content")).not.toBeInTheDocument();
  });

  it("renders version when not collapsed", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} />);

    expect(screen.getByText("AllyLab v1.0.0")).toBeInTheDocument();
  });

  it("hides version when collapsed", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} collapsed={true} />);

    expect(screen.queryByText("AllyLab v1.0.0")).not.toBeInTheDocument();
  });

  it("renders API status with connected status", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} apiStatus="connected" />);

    expect(screen.getByText("API Connected")).toBeInTheDocument();
  });

  it("renders API status with disconnected status", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} apiStatus="disconnected" />);

    expect(screen.getByText("API Disconnected")).toBeInTheDocument();
  });

  it("renders API status with checking status", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} apiStatus="checking" />);

    expect(screen.getByText("Checking...")).toBeInTheDocument();
  });

  it("hides API status when collapsed", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} collapsed={true} apiStatus="connected" />);

    expect(screen.queryByText("API Connected")).not.toBeInTheDocument();
  });

  it("renders group without title", () => {
    render(<Sidebar groups={groups} activeItem="settings" onItemClick={vi.fn()} />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("adds title attribute to items when collapsed", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} collapsed={true} />);

    // Use aria-label to find the button since icons are now React components
    const scanButton = screen.getByRole("button", { name: "Scan" });
    expect(scanButton).toHaveAttribute("title", "Scan");
  });

  it("does not add title attribute to items when not collapsed", () => {
    render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} />);

    const scanButton = screen.getByText("Scan").closest("button");
    expect(scanButton).not.toHaveAttribute("title");
  });

  it("applies correct width when collapsed", () => {
    const { container } = render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} collapsed={true} />);

    const aside = container.querySelector("aside");
    expect(aside).toHaveStyle({ width: "64px" });
  });

  it("applies correct width when not collapsed", () => {
    const { container } = render(<Sidebar groups={groups} activeItem="scan" onItemClick={vi.fn()} />);

    const aside = container.querySelector("aside");
    expect(aside).toHaveStyle({ width: "240px" });
  });
});
