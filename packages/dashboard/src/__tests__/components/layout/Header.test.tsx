// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Header } from "../../../components/layout/Header";

describe("layout/Header", () => {
  it("renders title and logo", () => {
    render(<Header title="Dashboard" apiStatus="connected" />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("🔬")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<Header title="Dashboard" subtitle="Test Subtitle" apiStatus="connected" />);

    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(<Header title="Dashboard" apiStatus="connected" />);

    const subtitles = screen.queryByText(/Test Subtitle/);
    expect(subtitles).not.toBeInTheDocument();
  });

  it("renders API status indicator with connected status", () => {
    render(<Header title="Dashboard" apiStatus="connected" />);

    expect(screen.getByText(/API ✓/)).toBeInTheDocument();
  });

  it("renders API status indicator with disconnected status", () => {
    render(<Header title="Dashboard" apiStatus="disconnected" />);

    expect(screen.getByText(/API ✗/)).toBeInTheDocument();
  });

  it("renders API status indicator with checking status", () => {
    render(<Header title="Dashboard" apiStatus="checking" />);

    expect(screen.getByText(/API \.\.\./)).toBeInTheDocument();
  });

  it("renders GitHub link with correct href", () => {
    render(<Header title="Dashboard" apiStatus="connected" />);

    const githubLink = screen.getByRole("link", { name: /GitHub/i });
    expect(githubLink).toHaveAttribute("href", "https://github.com/jorgejac1/allylab");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders GitHubIcon SVG", () => {
    const { container } = render(<Header title="Dashboard" apiStatus="connected" />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "16");
    expect(svg).toHaveAttribute("height", "16");
  });

  it("applies correct styling to header elements", () => {
    const { container } = render(<Header title="Dashboard" subtitle="Test" apiStatus="connected" />);

    const header = container.querySelector("header");
    expect(header).toHaveStyle({
      borderBottom: "1px solid #e2e8f0",
      background: "#ffffff",
    });
  });
});
