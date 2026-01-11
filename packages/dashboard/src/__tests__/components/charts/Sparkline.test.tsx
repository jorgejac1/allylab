// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { Sparkline } from "../../../components/charts/Sparkline";

afterEach(() => {
  cleanup();
});

describe("charts/Sparkline", () => {
  it("returns null when data has less than 2 points", () => {
    const { container } = render(<Sparkline data={[50]} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when data is empty", () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders SVG with default dimensions", () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "100");
    expect(svg).toHaveAttribute("height", "30");
  });

  it("renders SVG with custom dimensions", () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} width={200} height={50} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "200");
    expect(svg).toHaveAttribute("height", "50");
  });

  it("renders path element for the line", () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} />);
    const path = container.querySelector("path");
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute("fill", "none");
    expect(path).toHaveAttribute("stroke-width", "2");
  });

  it("uses default blue color when not specified", () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} />);
    const path = container.querySelector("path");
    expect(path).toHaveAttribute("stroke", "#2563eb");
  });

  it("uses custom color when specified", () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} color="#ff0000" />);
    const path = container.querySelector("path");
    expect(path).toHaveAttribute("stroke", "#ff0000");
  });

  it("uses green trend color when last value >= first value with auto color", () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} color="auto" />);
    const path = container.querySelector("path");
    expect(path).toHaveAttribute("stroke", "#10b981");
  });

  it("uses red trend color when last value < first value with auto color", () => {
    const { container } = render(<Sparkline data={[30, 20, 10]} color="auto" />);
    const path = container.querySelector("path");
    expect(path).toHaveAttribute("stroke", "#ef4444");
  });

  it("does not render dots by default", () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(0);
  });

  it("renders dots when showDots is true", () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} showDots={true} />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(3);
  });

  it("renders dots with correct radius", () => {
    const { container } = render(<Sparkline data={[10, 20]} showDots={true} />);
    const circles = container.querySelectorAll("circle");
    circles.forEach(circle => {
      expect(circle).toHaveAttribute("r", "3");
    });
  });

  it("fills last dot with color and other dots with white", () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} showDots={true} color="#2563eb" />);
    const circles = container.querySelectorAll("circle");
    expect(circles[0]).toHaveAttribute("fill", "#fff");
    expect(circles[1]).toHaveAttribute("fill", "#fff");
    expect(circles[2]).toHaveAttribute("fill", "#2563eb"); // Last dot filled
  });

  it("applies stroke linecap and linejoin to path", () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} />);
    const path = container.querySelector("path");
    expect(path).toHaveAttribute("stroke-linecap", "round");
    expect(path).toHaveAttribute("stroke-linejoin", "round");
  });

  it("generates correct path data starting with M", () => {
    const { container } = render(<Sparkline data={[10, 20]} />);
    const path = container.querySelector("path");
    const d = path?.getAttribute("d") || "";
    expect(d.startsWith("M")).toBe(true);
  });

  it("handles equal values (flat line)", () => {
    const { container } = render(<Sparkline data={[50, 50, 50]} />);
    const path = container.querySelector("path");
    expect(path).toBeInTheDocument();
  });

  it("handles auto color with equal first and last values", () => {
    const { container } = render(<Sparkline data={[50, 30, 50]} color="auto" />);
    const path = container.querySelector("path");
    // last >= first, so should be green
    expect(path).toHaveAttribute("stroke", "#10b981");
  });

  it("renders dots with stroke color", () => {
    const { container } = render(<Sparkline data={[10, 20]} showDots={true} color="#ff0000" />);
    const circles = container.querySelectorAll("circle");
    circles.forEach(circle => {
      expect(circle).toHaveAttribute("stroke", "#ff0000");
    });
  });

  it("renders dots with correct stroke width", () => {
    const { container } = render(<Sparkline data={[10, 20]} showDots={true} />);
    const circles = container.querySelectorAll("circle");
    circles.forEach(circle => {
      expect(circle).toHaveAttribute("stroke-width", "1.5");
    });
  });
});
