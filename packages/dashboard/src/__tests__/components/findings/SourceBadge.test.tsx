// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SourceBadge } from "../../../components/findings/SourceBadge";

describe("findings/SourceBadge", () => {
  it("renders custom rule badge", () => {
    const { container } = render(<SourceBadge source="custom-rule" />);

    // ClipboardList icon is rendered as SVG
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("renders axe-core badge when source is undefined", () => {
    const { container } = render(<SourceBadge />);

    // Search icon is rendered as SVG
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("axe-core")).toBeInTheDocument();
  });

  it("renders axe-core badge when source is axe-core", () => {
    const { container } = render(<SourceBadge source="axe-core" />);

    // Search icon is rendered as SVG
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("axe-core")).toBeInTheDocument();
  });

  it("applies custom styling for custom-rule source", () => {
    const { container } = render(<SourceBadge source="custom-rule" />);

    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("bg-sky-100", "text-sky-700", "border-sky-200");
  });

  it("applies default styling for axe-core source", () => {
    const { container } = render(<SourceBadge source="axe-core" />);

    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("bg-slate-100", "text-slate-500", "border-slate-200");
  });

  it("applies common styling to all badges", () => {
    const { container } = render(<SourceBadge source="custom-rule" />);

    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("inline-flex", "items-center", "gap-1", "py-0.5", "px-1.5", "rounded", "text-[10px]", "font-medium");
  });
});
