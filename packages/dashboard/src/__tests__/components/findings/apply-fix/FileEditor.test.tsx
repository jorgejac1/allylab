// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FileEditor } from "../../../../components/findings/apply-fix/FileEditor";

// Mock the utils module
vi.mock("../../../../components/findings/apply-fix/utils", () => ({
  findCodeInJsx: vi.fn((content, _code) => {
    if (content.includes('<button>Click</button>')) {
      return {
        lineStart: 5,
        lineEnd: 5,
        confidence: "high" as const,
        reason: "Exact match found",
        allInstances: [{ lineStart: 5, lineEnd: 5, confidence: "high" as const, reason: "Match 1", isComment: false }],
        isComment: false,
      };
    }
    return null;
  }),
  htmlToJsx: vi.fn((html) => html.replace(/class=/g, "className=")),
  extractAllClasses: vi.fn(() => ["btn", "primary"]),
}));

describe("findings/apply-fix/FileEditor", () => {
  const defaultProps = {
    filePath: "src/components/Button.tsx",
    fileContent: `import React from 'react';

export function Button() {
  return (
    <button>Click</button>
  );
}`,
    originalCode: '<button>Click</button>',
    fixedCode: '<button aria-label="Submit">Click</button>',
    isLoading: false,
    isCreatingPR: false,
    error: null,
    onBack: vi.fn(),
    onCreatePR: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state", () => {
    render(<FileEditor {...defaultProps} isLoading={true} />);

    expect(screen.getByText("Loading file content...")).toBeInTheDocument();
  });

  it("renders file path and name", () => {
    render(<FileEditor {...defaultProps} />);

    // Check for full path in subtitle
    expect(screen.getByText("src/components/Button.tsx")).toBeInTheDocument();
  });

  it("shows back button and calls onBack when clicked", () => {
    const onBack = vi.fn();
    render(<FileEditor {...defaultProps} onBack={onBack} />);

    const backButtons = screen.getAllByText("← Back");
    fireEvent.click(backButtons[0]);

    expect(onBack).toHaveBeenCalled();
  });

  it("displays error message when error prop is set", () => {
    render(<FileEditor {...defaultProps} error="Failed to create PR" />);

    expect(screen.getByText("Failed to create PR")).toBeInTheDocument();
  });

  it("disables Create PR button when no selection", () => {
    // Use content that won't match
    render(
      <FileEditor
        {...defaultProps}
        fileContent="const x = 1;"
        originalCode="<nomatch />"
      />
    );

    const createButton = screen.getByRole("button", { name: /Create PR/i });
    expect(createButton).toBeDisabled();
  });

  it("shows 'Creating PR...' when isCreatingPR is true", () => {
    render(<FileEditor {...defaultProps} isCreatingPR={true} />);

    expect(screen.getByText(/Creating PR\.\.\./)).toBeInTheDocument();
  });

  it("renders file content lines", () => {
    render(<FileEditor {...defaultProps} />);

    expect(screen.getByText(/import React/)).toBeInTheDocument();
  });

  it("shows JSX conversion note", () => {
    render(<FileEditor {...defaultProps} />);

    expect(screen.getByText(/Note:/)).toBeInTheDocument();
    expect(screen.getByText(/converted to JSX format/)).toBeInTheDocument();
  });

  it("shows keyboard shortcuts hint", () => {
    render(<FileEditor {...defaultProps} />);

    expect(screen.getByText(/Enter/)).toBeInTheDocument();
    expect(screen.getByText(/Esc/)).toBeInTheDocument();
  });

  it("toggles manual selection mode", () => {
    render(<FileEditor {...defaultProps} />);

    const checkbox = screen.getByLabelText(/Manual selection mode/);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("toggles diff preview", () => {
    render(<FileEditor {...defaultProps} />);

    const checkbox = screen.getByLabelText(/Show diff preview/);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("calls onBack on Escape key", () => {
    const onBack = vi.fn();
    render(<FileEditor {...defaultProps} onBack={onBack} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onBack).toHaveBeenCalled();
  });

  it("renders match status banner when no match found", () => {
    render(
      <FileEditor
        {...defaultProps}
        fileContent="const x = 1;"
        originalCode="<nomatch />"
      />
    );

    expect(screen.getByText(/Could not auto-detect/)).toBeInTheDocument();
  });

  it("renders match status banner when match found with high confidence", () => {
    render(<FileEditor {...defaultProps} />);

    expect(screen.getByText(/Match found!/)).toBeInTheDocument();
  });

  it("shows diff preview panel", () => {
    render(<FileEditor {...defaultProps} />);

    expect(screen.getByText("⊖ Current Code")).toBeInTheDocument();
    expect(screen.getByText("⊕ Fixed Code (JSX)")).toBeInTheDocument();
  });

  it("renders replacement preview with fixed JSX", () => {
    render(<FileEditor {...defaultProps} />);

    // The fixed code with className conversion should be shown
    expect(screen.getByText(/will be replaced with:/)).toBeInTheDocument();
  });
});
