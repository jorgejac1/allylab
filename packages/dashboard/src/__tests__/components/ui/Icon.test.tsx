// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Icon } from "../../../components/ui/Icon";

describe("ui/Icon", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("renders a known icon", () => {
    const { container } = render(<Icon name="search" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders with custom size", () => {
    const { container } = render(<Icon name="check" size={24} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
  });

  it("renders with custom color", () => {
    const { container } = render(<Icon name="warning" color="#ff0000" />);
    const svg = container.querySelector("svg");
    // Lucide applies color as stroke attribute
    expect(svg).toHaveAttribute("stroke", "#ff0000");
  });

  it("renders with className", () => {
    const { container } = render(<Icon name="close" className="custom-class" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("custom-class");
  });

  it("renders with custom style", () => {
    const { container } = render(<Icon name="edit" style={{ marginRight: 8 }} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveStyle({ marginRight: "8px" });
  });

  it("sets aria-hidden by default", () => {
    const { container } = render(<Icon name="info" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("allows overriding aria-hidden", () => {
    const { container } = render(<Icon name="success" aria-hidden={false} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "false");
  });

  it("returns null and logs warning for unknown icon", () => {
    const { container } = render(<Icon name="unknown-icon-name" />);
    expect(container.firstChild).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('Icon "unknown-icon-name" not found in icon map');
  });

  it("renders various icons from iconMap", () => {
    const icons = ["search", "close", "check", "copy", "clipboard", "refresh", "upload", "download", "edit", "plus", "trash", "link", "external-link", "back", "chevron-down", "more", "play", "warning", "info", "success", "error", "alert-circle", "ban", "undo", "chart", "target", "settings", "wrench", "map", "book", "lightbulb", "image", "file-code", "desktop", "tablet", "mobile", "microscope", "sparkles", "clock", "loader"];

    icons.forEach(iconName => {
      const { container } = render(<Icon name={iconName} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });
});
