/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  EditorHeader,
  MatchStatusBanner,
  InstanceNavigator,
  EditorControls,
  EditorActions,
  ReplacementPreview,
  JSXConversionNote,
  PRInfoNote,
} from "../../../../../components/findings/apply-fix/file-editor";
import type { CodeLocation } from "../../../../../components/findings/apply-fix/utils";

// Mock UI components
vi.mock("../../../../../components/ui", () => ({
  Button: ({ children, onClick, variant, disabled }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

describe("file-editor/EditorHeader", () => {
  const defaultProps = {
    filePath: "src/components/Button.tsx",
    onBack: vi.fn(),
  };

  it("renders file name from path", () => {
    render(<EditorHeader {...defaultProps} />);
    expect(screen.getByText(/Edit: Button.tsx/)).toBeInTheDocument();
  });

  it("renders full file path", () => {
    render(<EditorHeader {...defaultProps} />);
    expect(screen.getByText("src/components/Button.tsx")).toBeInTheDocument();
  });

  it("renders Back button", () => {
    render(<EditorHeader {...defaultProps} />);
    expect(screen.getByText("← Back")).toBeInTheDocument();
  });

  it("calls onBack when Back button is clicked", () => {
    const onBack = vi.fn();
    render(<EditorHeader {...defaultProps} onBack={onBack} />);

    fireEvent.click(screen.getByText("← Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("handles nested file paths", () => {
    render(<EditorHeader filePath="src/deep/nested/path/Component.tsx" onBack={vi.fn()} />);
    expect(screen.getByText(/Edit: Component.tsx/)).toBeInTheDocument();
  });

  it("renders edit icon", () => {
    const { container } = render(<EditorHeader {...defaultProps} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("file-editor/MatchStatusBanner", () => {
  const makeAutoMatch = (overrides: Partial<CodeLocation> = {}): CodeLocation => ({
    lineStart: 10,
    lineEnd: 15,
    confidence: "high",
    matchedCode: "<button>Click</button>",
    reason: "Exact match found",
    ...overrides,
  });

  it("renders no match banner when autoMatch is null", () => {
    render(<MatchStatusBanner autoMatch={null} />);
    expect(screen.getByText(/Could not auto-detect the code location/)).toBeInTheDocument();
  });

  it("displays manual selection hint when no match", () => {
    render(<MatchStatusBanner autoMatch={null} />);
    expect(screen.getByText(/Please enable "Manual selection mode"/)).toBeInTheDocument();
  });

  it("renders high confidence match", () => {
    render(<MatchStatusBanner autoMatch={makeAutoMatch({ confidence: "high" })} />);
    expect(screen.getByText("Match found!")).toBeInTheDocument();
  });

  it("renders medium confidence match", () => {
    render(<MatchStatusBanner autoMatch={makeAutoMatch({ confidence: "medium" })} />);
    expect(screen.getByText("Likely match found - please verify")).toBeInTheDocument();
  });

  it("renders low confidence match", () => {
    render(<MatchStatusBanner autoMatch={makeAutoMatch({ confidence: "low" })} />);
    expect(screen.getByText("Possible match - please verify carefully")).toBeInTheDocument();
  });

  it("displays line numbers", () => {
    render(<MatchStatusBanner autoMatch={makeAutoMatch({ lineStart: 42, lineEnd: 50 })} />);
    expect(screen.getByText(/Lines 42-50/)).toBeInTheDocument();
  });

  it("displays reason text", () => {
    render(<MatchStatusBanner autoMatch={makeAutoMatch({ reason: "Test reason" })} />);
    expect(screen.getByText("Test reason")).toBeInTheDocument();
  });

  it("shows comment warning when isComment is true", () => {
    render(<MatchStatusBanner autoMatch={makeAutoMatch({ isComment: true })} />);
    expect(screen.getByText(/This appears to be in a comment or type definition/)).toBeInTheDocument();
  });

  it("shows instance count when multiple instances", () => {
    const autoMatch = makeAutoMatch({
      allInstances: [
        { lineStart: 10, lineEnd: 15, isComment: false },
        { lineStart: 20, lineEnd: 25, isComment: false },
      ],
    });
    render(<MatchStatusBanner autoMatch={autoMatch} />);
    expect(screen.getByText("2 instances")).toBeInTheDocument();
  });

  it("shows navigation hint for multiple instances", () => {
    const autoMatch = makeAutoMatch({
      allInstances: [
        { lineStart: 10, lineEnd: 15, isComment: false },
        { lineStart: 20, lineEnd: 25, isComment: false },
      ],
    });
    render(<MatchStatusBanner autoMatch={autoMatch} />);
    expect(screen.getByText(/Use/)).toBeInTheDocument();
    expect(screen.getByText(/to navigate between instances/)).toBeInTheDocument();
  });
});

describe("file-editor/InstanceNavigator", () => {
  const makeAutoMatch = (instanceCount: number): CodeLocation => ({
    lineStart: 10,
    lineEnd: 15,
    confidence: "high",
    matchedCode: "<button>Click</button>",
    reason: "Match",
    allInstances: Array.from({ length: instanceCount }, (_, i) => ({
      lineStart: 10 + i * 10,
      lineEnd: 15 + i * 10,
      isComment: false,
    })),
  });

  it("returns null when no autoMatch", () => {
    const { container } = render(
      <InstanceNavigator autoMatch={null} currentInstanceIndex={0} onGoToInstance={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("returns null when single instance", () => {
    const { container } = render(
      <InstanceNavigator
        autoMatch={makeAutoMatch(1)}
        currentInstanceIndex={0}
        onGoToInstance={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders when multiple instances", () => {
    render(
      <InstanceNavigator
        autoMatch={makeAutoMatch(3)}
        currentInstanceIndex={0}
        onGoToInstance={vi.fn()}
      />
    );
    expect(screen.getByText(/Instance 1 of 3/)).toBeInTheDocument();
  });

  it("renders navigation buttons for each instance", () => {
    render(
      <InstanceNavigator
        autoMatch={makeAutoMatch(3)}
        currentInstanceIndex={0}
        onGoToInstance={vi.fn()}
      />
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("calls onGoToInstance when button clicked", () => {
    const onGoToInstance = vi.fn();
    render(
      <InstanceNavigator
        autoMatch={makeAutoMatch(3)}
        currentInstanceIndex={0}
        onGoToInstance={onGoToInstance}
      />
    );

    fireEvent.click(screen.getByText("2"));
    expect(onGoToInstance).toHaveBeenCalledWith(1);
  });

  it("shows current instance with aria-current", () => {
    render(
      <InstanceNavigator
        autoMatch={makeAutoMatch(3)}
        currentInstanceIndex={1}
        onGoToInstance={vi.fn()}
      />
    );

    const currentButton = screen.getByText("2");
    expect(currentButton).toHaveAttribute("aria-current", "true");
  });

  it("has accessible labels for buttons", () => {
    render(
      <InstanceNavigator
        autoMatch={makeAutoMatch(2)}
        currentInstanceIndex={0}
        onGoToInstance={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Go to instance 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Go to instance 2")).toBeInTheDocument();
  });
});

describe("file-editor/EditorControls", () => {
  const defaultProps = {
    manualMode: false,
    showDiffPreview: false,
    selectedLines: null,
    onManualModeChange: vi.fn(),
    onShowDiffPreviewChange: vi.fn(),
  };

  it("renders manual mode checkbox", () => {
    render(<EditorControls {...defaultProps} />);
    expect(screen.getByLabelText(/Manual selection mode/)).toBeInTheDocument();
  });

  it("renders diff preview checkbox", () => {
    render(<EditorControls {...defaultProps} />);
    expect(screen.getByLabelText(/Show diff preview/)).toBeInTheDocument();
  });

  it("manual mode checkbox reflects state", () => {
    render(<EditorControls {...defaultProps} manualMode={true} />);
    const checkbox = screen.getByLabelText(/Manual selection mode/) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("diff preview checkbox reflects state", () => {
    render(<EditorControls {...defaultProps} showDiffPreview={true} />);
    const checkbox = screen.getByLabelText(/Show diff preview/) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("calls onManualModeChange when checkbox changed", () => {
    const onManualModeChange = vi.fn();
    render(<EditorControls {...defaultProps} onManualModeChange={onManualModeChange} />);

    fireEvent.click(screen.getByLabelText(/Manual selection mode/));
    expect(onManualModeChange).toHaveBeenCalledWith(true);
  });

  it("calls onShowDiffPreviewChange when checkbox changed", () => {
    const onShowDiffPreviewChange = vi.fn();
    render(<EditorControls {...defaultProps} onShowDiffPreviewChange={onShowDiffPreviewChange} />);

    fireEvent.click(screen.getByLabelText(/Show diff preview/));
    expect(onShowDiffPreviewChange).toHaveBeenCalledWith(true);
  });

  it("does not show selected lines when null", () => {
    render(<EditorControls {...defaultProps} />);
    expect(screen.queryByText(/Lines \d+-\d+/)).not.toBeInTheDocument();
  });

  it("shows selected lines when provided", () => {
    render(<EditorControls {...defaultProps} selectedLines={{ start: 10, end: 20 }} />);
    expect(screen.getByText(/Lines 10-20/)).toBeInTheDocument();
  });
});

describe("file-editor/EditorActions", () => {
  const defaultProps = {
    selectedLines: { start: 10, end: 20 },
    isCreatingPR: false,
    onBack: vi.fn(),
    onCreatePR: vi.fn(),
  };

  it("renders Back button", () => {
    render(<EditorActions {...defaultProps} />);
    expect(screen.getByText("← Back")).toBeInTheDocument();
  });

  it("renders Create PR button", () => {
    render(<EditorActions {...defaultProps} />);
    const button = screen.getByRole("button", { name: /Create PR/ });
    expect(button).toBeInTheDocument();
  });

  it("calls onBack when Back button clicked", () => {
    const onBack = vi.fn();
    render(<EditorActions {...defaultProps} onBack={onBack} />);

    fireEvent.click(screen.getByText("← Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onCreatePR when Create PR button clicked", () => {
    const onCreatePR = vi.fn();
    render(<EditorActions {...defaultProps} onCreatePR={onCreatePR} />);

    const button = screen.getByRole("button", { name: /Create PR/ });
    fireEvent.click(button);
    expect(onCreatePR).toHaveBeenCalledTimes(1);
  });

  it("disables Create PR button when no selected lines", () => {
    render(<EditorActions {...defaultProps} selectedLines={null} />);
    const button = screen.getByRole("button", { name: /Create PR/ });
    expect(button).toBeDisabled();
  });

  it("disables Create PR button when creating PR", () => {
    render(<EditorActions {...defaultProps} isCreatingPR={true} />);
    const button = screen.getByText(/Creating PR.../);
    expect(button).toBeDisabled();
  });

  it("shows loading state when creating PR", () => {
    render(<EditorActions {...defaultProps} isCreatingPR={true} />);
    expect(screen.getByText(/Creating PR.../)).toBeInTheDocument();
  });

  it("renders keyboard hints", () => {
    render(<EditorActions {...defaultProps} />);
    expect(screen.getByText(/Enter/)).toBeInTheDocument();
    expect(screen.getByText(/Esc/)).toBeInTheDocument();
  });
});

describe("file-editor/ReplacementPreview", () => {
  const defaultProps = {
    selectedLines: { start: 10, end: 15 },
    fixedJsx: '<button className="btn">Click</button>',
  };

  it("renders line numbers being replaced", () => {
    render(<ReplacementPreview {...defaultProps} />);
    expect(screen.getByText(/Lines 10-15 will be replaced with/)).toBeInTheDocument();
  });

  it("renders fixed JSX code", () => {
    render(<ReplacementPreview {...defaultProps} />);
    expect(screen.getByText('<button className="btn">Click</button>')).toBeInTheDocument();
  });

  it("renders in code block", () => {
    const { container } = render(<ReplacementPreview {...defaultProps} />);
    expect(container.querySelector("pre")).toBeInTheDocument();
  });
});

describe("file-editor/JSXConversionNote", () => {
  it("renders conversion note", () => {
    render(<JSXConversionNote />);
    expect(screen.getByText(/The fix has been converted to JSX format/)).toBeInTheDocument();
  });

  it("shows className reference", () => {
    render(<JSXConversionNote />);
    expect(screen.getByText("className")).toBeInTheDocument();
  });

  it("renders lightbulb icon", () => {
    const { container } = render(<JSXConversionNote />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("file-editor/PRInfoNote", () => {
  it("renders info about PR creation", () => {
    render(<PRInfoNote />);
    expect(screen.getByText(/A new branch will be created/)).toBeInTheDocument();
    expect(screen.getByText(/PR opened for review/)).toBeInTheDocument();
  });
});
