// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FixCodePreview } from "../../../components/findings/FixCodePreview";
import type { CodeFix } from "../../../types/fixes";

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe("findings/FixCodePreview", () => {
  const baseFix: CodeFix = {
    id: 'fix1',
    findingId: 'f1',
    ruleId: 'r1',
    createdAt: '2024-01-01T00:00:00Z',
    original: {
      code: '<div>Original code</div>',
      selector: 'div',
      language: 'html',
    },
    fixes: {
      html: '<div role="button">Fixed code</div>',
      react: '<div role="button">Fixed React code</div>',
      vue: '<div role="button">Fixed Vue code</div>',
    },
    diff: '- <div>Original code</div>\n+ <div role="button">Fixed code</div>',
    explanation: 'Add role attribute for accessibility',
    confidence: 'high',
    effort: 'trivial',
    wcagCriteria: ['WCAG2.1.1', 'WCAG4.1.2'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders confidence badge", () => {
    render(<FixCodePreview fix={baseFix} />);
    expect(screen.getByText("High Confidence")).toBeInTheDocument();
  });

  it("renders effort badge", () => {
    render(<FixCodePreview fix={baseFix} />);
    expect(screen.getByText("⚡ Trivial")).toBeInTheDocument();
  });

  it("renders all confidence levels correctly", () => {
    const { rerender } = render(<FixCodePreview fix={{ ...baseFix, confidence: 'high' }} />);
    expect(screen.getByText("High Confidence")).toBeInTheDocument();

    rerender(<FixCodePreview fix={{ ...baseFix, confidence: 'medium' }} />);
    expect(screen.getByText("Medium Confidence")).toBeInTheDocument();

    rerender(<FixCodePreview fix={{ ...baseFix, confidence: 'low' }} />);
    expect(screen.getByText("Review Carefully")).toBeInTheDocument();
  });

  it("renders all effort levels correctly", () => {
    const { rerender } = render(<FixCodePreview fix={{ ...baseFix, effort: 'trivial' }} />);
    expect(screen.getByText("⚡ Trivial")).toBeInTheDocument();

    rerender(<FixCodePreview fix={{ ...baseFix, effort: 'easy' }} />);
    expect(screen.getByText("🟢 Easy")).toBeInTheDocument();

    rerender(<FixCodePreview fix={{ ...baseFix, effort: 'medium' }} />);
    expect(screen.getByText("🟡 Medium")).toBeInTheDocument();

    rerender(<FixCodePreview fix={{ ...baseFix, effort: 'complex' }} />);
    expect(screen.getByText("🔴 Complex")).toBeInTheDocument();
  });

  it("renders explanation", () => {
    render(<FixCodePreview fix={baseFix} />);
    expect(screen.getByText(/Add role attribute for accessibility/)).toBeInTheDocument();
  });

  it("renders framework tabs when multiple frameworks available", () => {
    render(<FixCodePreview fix={baseFix} />);
    expect(screen.getByText("html")).toBeInTheDocument();
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("vue")).toBeInTheDocument();
  });

  it("does not render framework tabs when only one framework", () => {
    const singleFrameworkFix = {
      ...baseFix,
      fixes: { html: '<div role="button">Fixed</div>', react: '', vue: '' },
    };
    render(<FixCodePreview fix={singleFrameworkFix} />);
    expect(screen.queryByText("html")).not.toBeInTheDocument();
  });

  it("switches framework when tab is clicked", () => {
    render(<FixCodePreview fix={baseFix} />);
    expect(screen.getByText(/Fixed code/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("react"));
    expect(screen.getByText(/Fixed React code/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("vue"));
    expect(screen.getByText(/Fixed Vue code/)).toBeInTheDocument();
  });

  it("renders view mode toggle buttons", () => {
    render(<FixCodePreview fix={baseFix} />);
    expect(screen.getByText("✅ Fixed")).toBeInTheDocument();
    expect(screen.getByText("📊 Diff")).toBeInTheDocument();
    expect(screen.getByText("📄 Original")).toBeInTheDocument();
  });

  it("switches to original view when original button is clicked", () => {
    render(<FixCodePreview fix={baseFix} />);
    fireEvent.click(screen.getByText("📄 Original"));
    expect(screen.getByText(/Original code/)).toBeInTheDocument();
  });

  it("switches to diff view when diff button is clicked", () => {
    render(<FixCodePreview fix={baseFix} />);
    fireEvent.click(screen.getByText("📊 Diff"));
    expect(screen.getByText(/- <div>Original code<\/div>/)).toBeInTheDocument();
  });

  it("renders copy button", () => {
    render(<FixCodePreview fix={baseFix} />);
    expect(screen.getByText("📋 Copy")).toBeInTheDocument();
  });

  it("copies code to clipboard when copy button is clicked", async () => {
    render(<FixCodePreview fix={baseFix} />);
    fireEvent.click(screen.getByText("📋 Copy"));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('<div role="button">Fixed code</div>');
    });
  });

  it("shows copied state after copying", async () => {
    render(<FixCodePreview fix={baseFix} />);
    fireEvent.click(screen.getByText("📋 Copy"));

    await waitFor(() => {
      expect(screen.getByText("✓ Copied!")).toBeInTheDocument();
    });
  });

  it("calls onCopy callback when provided", async () => {
    const onCopy = vi.fn();
    render(<FixCodePreview fix={baseFix} onCopy={onCopy} />);
    fireEvent.click(screen.getByText("📋 Copy"));

    await waitFor(() => {
      expect(onCopy).toHaveBeenCalledWith('<div role="button">Fixed code</div>');
    });
  });

  it("renders WCAG criteria links", () => {
    render(<FixCodePreview fix={baseFix} />);
    const links = screen.getAllByRole("link");
    const wcagLinks = links.filter(link => link.textContent?.includes("WCAG"));
    expect(wcagLinks.length).toBe(2);
  });

  it("renders WCAG links with correct URLs", () => {
    render(<FixCodePreview fix={baseFix} />);
    const link = screen.getByText(/WCAG2\.1\.1/);
    expect(link).toHaveAttribute("href", "https://www.w3.org/WAI/WCAG21/Understanding/wcag211");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not render WCAG section when no criteria", () => {
    const noWcagFix = { ...baseFix, wcagCriteria: [] };
    const { container } = render(<FixCodePreview fix={noWcagFix} />);
    const wcagLinks = container.querySelectorAll('a[href*="wcag"]');
    expect(wcagLinks.length).toBe(0);
  });

  it("applies correct styling to confidence badge for high confidence", () => {
    render(<FixCodePreview fix={{ ...baseFix, confidence: 'high' }} />);
    const badge = screen.getByText("High Confidence");
    expect(badge).toHaveStyle({
      background: "rgb(220, 252, 231)",
      color: "rgb(21, 128, 61)",
    });
  });

  it("applies correct styling to confidence badge for medium confidence", () => {
    render(<FixCodePreview fix={{ ...baseFix, confidence: 'medium' }} />);
    const badge = screen.getByText("Medium Confidence");
    expect(badge).toHaveStyle({
      background: "rgb(254, 243, 199)",
      color: "rgb(146, 64, 14)",
    });
  });

  it("applies correct styling to confidence badge for low confidence", () => {
    render(<FixCodePreview fix={{ ...baseFix, confidence: 'low' }} />);
    const badge = screen.getByText("Review Carefully");
    expect(badge).toHaveStyle({
      background: "rgb(254, 242, 242)",
      color: "rgb(220, 38, 38)",
    });
  });

  it("renders diff view with colored lines", () => {
    render(<FixCodePreview fix={baseFix} />);
    fireEvent.click(screen.getByText("📊 Diff"));

    const diffContainer = screen.getByText(/- <div>Original code<\/div>/);
    expect(diffContainer).toBeInTheDocument();
  });

  it("shows fixed code by default", () => {
    render(<FixCodePreview fix={baseFix} />);
    expect(screen.getByText(/Fixed code/)).toBeInTheDocument();
  });

  it("copies original code when in original view", async () => {
    render(<FixCodePreview fix={baseFix} />);
    fireEvent.click(screen.getByText("📄 Original"));
    fireEvent.click(screen.getByText("📋 Copy"));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('<div>Original code</div>');
    });
  });

  it("copies diff when in diff view", async () => {
    render(<FixCodePreview fix={baseFix} />);
    fireEvent.click(screen.getByText("📊 Diff"));
    fireEvent.click(screen.getByText("📋 Copy"));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(baseFix.diff);
    });
  });

  it("falls back to html fix when active framework has no code", () => {
    // Create a fix where html has code but react tab shows (with non-empty react initially)
    // Then we use rerender to test what happens when framework becomes empty
    const fixWithEmptyReact: CodeFix = {
      ...baseFix,
      fixes: {
        html: '<div role="button">HTML fallback</div>',
        react: '', // Empty - should fall back to html
        vue: '<div role="button">Vue code</div>',
      },
    };

    render(<FixCodePreview fix={fixWithEmptyReact} />);

    // The component filters out empty frameworks, so react won't show
    // HTML is shown by default since activeFramework starts as 'html'
    expect(screen.getByText(/HTML fallback/)).toBeInTheDocument();
  });

  it("falls back to html when selected framework code is undefined", () => {
    const fixWithUndefinedFramework: CodeFix = {
      ...baseFix,
      fixes: {
        html: '<div>HTML fallback code</div>',
        react: undefined as unknown as string,
        vue: undefined as unknown as string,
      },
    };

    render(<FixCodePreview fix={fixWithUndefinedFramework} />);
    expect(screen.getByText(/HTML fallback code/)).toBeInTheDocument();
  });

  it("uses html fallback when switching to framework with empty code", async () => {
    // This test verifies the || fix.fixes.html fallback
    // We create a fix where react initially has code (so it shows in tabs)
    // but then simulate the scenario where the selected framework's code becomes falsy

    const fixWithReact: CodeFix = {
      ...baseFix,
      fixes: {
        html: '<div>HTML Code Here</div>',
        react: '<div>React Code</div>',
        vue: '',
      },
    };

    const { rerender } = render(<FixCodePreview fix={fixWithReact} />);

    // Click on react tab
    fireEvent.click(screen.getByText("react"));

    // Verify react code is shown
    expect(screen.getByText(/React Code/)).toBeInTheDocument();

    // Now rerender with empty react code - this should trigger the fallback to html
    const fixWithEmptyReact: CodeFix = {
      ...baseFix,
      fixes: {
        html: '<div>Fallback to HTML</div>',
        react: '', // Now empty - should fall back to html
        vue: '',
      },
    };

    rerender(<FixCodePreview fix={fixWithEmptyReact} />);

    // The activeFramework state is still 'react' but fix.fixes['react'] is now empty
    // So it should fall back to fix.fixes.html
    expect(screen.getByText(/Fallback to HTML/)).toBeInTheDocument();
  });

  it("renders diff view with red styling for removed lines", () => {
    const diffWithRemovals = {
      ...baseFix,
      diff: '- <div>Removed line</div>\n+ <div role="button">Added line</div>',
    };

    render(<FixCodePreview fix={diffWithRemovals} />);
    fireEvent.click(screen.getByText("📊 Diff"));

    const removedLine = screen.getByText(/- <div>Removed line<\/div>/);
    expect(removedLine).toBeInTheDocument();
    // The removed line should have red color styling
    expect(removedLine).toHaveStyle({ color: 'rgb(248, 113, 113)' });
  });

  it("renders diff view with green styling for added lines", () => {
    const diffWithAdditions = {
      ...baseFix,
      diff: '- <div>Old</div>\n+ <div role="button">New</div>',
    };

    render(<FixCodePreview fix={diffWithAdditions} />);
    fireEvent.click(screen.getByText("📊 Diff"));

    const addedLine = screen.getByText(/\+ <div role="button">New<\/div>/);
    expect(addedLine).toBeInTheDocument();
    // The added line should have green color styling
    expect(addedLine).toHaveStyle({ color: 'rgb(74, 222, 128)' });
  });

  it("renders diff view with default styling for context lines", () => {
    const diffWithContext = {
      ...baseFix,
      diff: '  <div>Context line</div>\n- <div>Removed</div>\n+ <div>Added</div>',
    };

    render(<FixCodePreview fix={diffWithContext} />);
    fireEvent.click(screen.getByText("📊 Diff"));

    // Context line (doesn't start with + or -) should have default color
    const contextLine = screen.getByText(/Context line/);
    expect(contextLine).toBeInTheDocument();
    expect(contextLine).toHaveStyle({ color: 'rgb(226, 232, 240)' });
  });

  it("renders empty diff lines as a space character", () => {
    const diffWithEmptyLine = {
      ...baseFix,
      diff: '- <div>Before</div>\n\n+ <div>After</div>',
    };

    render(<FixCodePreview fix={diffWithEmptyLine} />);
    fireEvent.click(screen.getByText("📊 Diff"));

    // The empty line should be rendered (as a non-breaking space for layout)
    // We can verify by checking the diff view has 3 child divs (one for each line)
    const beforeLine = screen.getByText(/- <div>Before<\/div>/);
    const afterLine = screen.getByText(/\+ <div>After<\/div>/);
    expect(beforeLine).toBeInTheDocument();
    expect(afterLine).toBeInTheDocument();

    // Get the parent code element and verify it has 3 children (including empty line)
    const codeElement = beforeLine.closest('code');
    expect(codeElement?.children.length).toBe(3);
  });

  it("renders space for empty lines in diff to preserve layout", () => {
    const diffWithMultipleEmptyLines = {
      ...baseFix,
      diff: '+ Added\n\n\n- Removed',
    };

    render(<FixCodePreview fix={diffWithMultipleEmptyLines} />);
    fireEvent.click(screen.getByText("📊 Diff"));

    // Find the code element containing the diff
    const addedLine = screen.getByText(/\+ Added/);
    const codeElement = addedLine.closest('code');

    // Should have 4 children: "+ Added", empty, empty, "- Removed"
    expect(codeElement?.children.length).toBe(4);

    // The empty lines should contain a space (or &nbsp;) to maintain height
    const emptyLines = Array.from(codeElement?.children || []).filter(
      child => child.textContent?.trim() === ''
    );
    expect(emptyLines.length).toBe(2);
  });
});
