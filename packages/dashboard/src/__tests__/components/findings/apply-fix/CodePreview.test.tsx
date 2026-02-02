// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CodePreview } from "../../../../components/findings/apply-fix/CodePreview";

describe("findings/apply-fix/CodePreview", () => {
  it("renders original and fixed code sections", () => {
    render(
      <CodePreview
        original='<div class="old">Original</div>'
        fixed='<div class="new">Fixed</div>'
      />
    );

    expect(screen.getByText("Find This")).toBeInTheDocument();
    expect(screen.getByText("Replace With")).toBeInTheDocument();
  });

  it("displays the original code content", () => {
    const originalCode = '<button>Click me</button>';
    render(<CodePreview original={originalCode} fixed="<button>New</button>" />);

    expect(screen.getByText(originalCode)).toBeInTheDocument();
  });

  it("displays the fixed code content", () => {
    const fixedCode = '<button aria-label="Submit">Submit</button>';
    render(<CodePreview original="<button>Old</button>" fixed={fixedCode} />);

    expect(screen.getByText(fixedCode)).toBeInTheDocument();
  });

  it("renders colored indicator dots", () => {
    const { container } = render(
      <CodePreview original="<div>A</div>" fixed="<div>B</div>" />
    );

    // Red dot for original
    const redDot = container.querySelector('span[style*="background: rgb(220, 38, 38)"]');
    expect(redDot).toBeInTheDocument();

    // Green dot for fixed
    const greenDot = container.querySelector('span[style*="background: rgb(22, 163, 74)"]');
    expect(greenDot).toBeInTheDocument();
  });

  it("renders code in pre elements with correct styling", () => {
    const { container } = render(
      <CodePreview original="<span>A</span>" fixed="<span>B</span>" />
    );

    const preElements = container.querySelectorAll("pre");
    expect(preElements).toHaveLength(2);

    // First pre (original) should have red background
    expect(preElements[0]).toHaveStyle({ background: "#fef2f2" });

    // Second pre (fixed) should have green background
    expect(preElements[1]).toHaveStyle({ background: "#f0fdf4" });
  });

  it("handles empty strings", () => {
    const { container } = render(<CodePreview original="" fixed="" />);

    const preElements = container.querySelectorAll("pre");
    expect(preElements).toHaveLength(2);
    expect(preElements[0]).toBeEmptyDOMElement();
    expect(preElements[1]).toBeEmptyDOMElement();
  });

  it("handles long code with proper overflow styling", () => {
    const longCode = '<div class="very-long-class-name another-class yet-another-class">' +
      'Some very long content that might overflow the container' +
      '</div>';

    const { container } = render(
      <CodePreview original={longCode} fixed={longCode} />
    );

    const preElements = container.querySelectorAll("pre");
    preElements.forEach(pre => {
      expect(pre).toHaveStyle({ overflow: "auto" });
      expect(pre).toHaveStyle({ maxHeight: "150px" });
      expect(pre).toHaveStyle({ whiteSpace: "pre-wrap" });
    });
  });

  it("renders with grid layout", () => {
    const { container } = render(
      <CodePreview original="<a>Link</a>" fixed="<a>New Link</a>" />
    );

    const gridContainer = container.firstChild as HTMLElement;
    expect(gridContainer).toHaveStyle({ display: "grid" });
    expect(gridContainer).toHaveStyle({ gridTemplateColumns: "1fr 1fr" });
  });
});
