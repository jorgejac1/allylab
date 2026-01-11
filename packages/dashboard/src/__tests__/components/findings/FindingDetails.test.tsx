// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FindingDetails, FindingDetailsDrawer } from "../../../components/findings/FindingDetails";
import type { TrackedFinding } from "../../../types";

// Mock UI components
vi.mock("../../../components/ui", () => ({
  Button: ({ children, onClick, disabled, variant, size, style, onAnimationEnd }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
    style?: React.CSSProperties;
    onAnimationEnd?: () => void;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`button-${variant || "default"}-${size || "default"}`}
      data-variant={variant}
      data-size={size}
      style={style}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </button>
  ),
  SeverityBadge: ({ severity }: { severity: string }) => (
    <span data-testid="severity-badge">{severity}</span>
  ),
  StatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

describe("components/findings/FindingDetails", () => {
  const makeFinding = (overrides: Partial<TrackedFinding> = {}): TrackedFinding => ({
    id: "f1",
    ruleId: "image-alt",
    ruleTitle: "Images must have alternate text",
    description: "Ensures <img> elements have alternate text or a role of none or presentation",
    impact: "critical",
    selector: "img.hero-image",
    html: '<img src="hero.jpg" class="hero-image">',
    helpUrl: "https://dequeuniversity.com/rules/axe/4.4/image-alt",
    wcagTags: ["wcag2a", "wcag111"],
    status: "new",
    fingerprint: "fp123",
    firstSeen: "2024-01-01T00:00:00Z",
    lastSeen: "2024-01-15T00:00:00Z",
    ...overrides,
  });

  const defaultProps = {
    finding: makeFinding(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("FindingDetails", () => {
    it("renders finding title and description", () => {
      render(<FindingDetails {...defaultProps} />);

      expect(screen.getByText("Images must have alternate text")).toBeInTheDocument();
      expect(screen.getByText(/Ensures <img> elements have alternate text/)).toBeInTheDocument();
    });

    it("renders close button that calls onClose", () => {
      const onClose = vi.fn();
      render(<FindingDetails {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByText("×");
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("renders severity and status badges", () => {
      render(<FindingDetails {...defaultProps} />);

      expect(screen.getByTestId("severity-badge")).toHaveTextContent("critical");
      expect(screen.getByTestId("status-badge")).toHaveTextContent("new");
    });

    it("renders WCAG tags", () => {
      render(<FindingDetails {...defaultProps} />);

      expect(screen.getByText("wcag2a")).toBeInTheDocument();
      expect(screen.getByText("wcag111")).toBeInTheDocument();
    });

    it("renders CSS selector", () => {
      render(<FindingDetails {...defaultProps} />);

      expect(screen.getByText("img.hero-image")).toBeInTheDocument();
    });

    it("renders current HTML", () => {
      render(<FindingDetails {...defaultProps} />);

      expect(screen.getByText('<img src="hero.jpg" class="hero-image">')).toBeInTheDocument();
    });

    it("renders Learn More link with correct href", () => {
      render(<FindingDetails {...defaultProps} />);

      const learnMoreLink = screen.getByText("📚 WCAG Documentation →");
      expect(learnMoreLink).toHaveAttribute("href", "https://dequeuniversity.com/rules/axe/4.4/image-alt");
      expect(learnMoreLink).toHaveAttribute("target", "_blank");
      expect(learnMoreLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders tracking history when firstSeen and lastSeen are provided", () => {
      render(<FindingDetails {...defaultProps} />);

      expect(screen.getByText("First seen:")).toBeInTheDocument();
      expect(screen.getByText("Last seen:")).toBeInTheDocument();
    });

    it("does not render tracking history when dates are not provided", () => {
      const finding = makeFinding({ firstSeen: undefined, lastSeen: undefined });
      render(<FindingDetails {...defaultProps} finding={finding} />);

      expect(screen.queryByText("First seen:")).not.toBeInTheDocument();
      expect(screen.queryByText("Last seen:")).not.toBeInTheDocument();
    });

    it("renders similar count button when similarCount > 0", () => {
      render(<FindingDetails {...defaultProps} similarCount={5} />);

      expect(screen.getByText("+5 similar issues")).toBeInTheDocument();
    });

    it("does not render similar count button when similarCount is 0", () => {
      render(<FindingDetails {...defaultProps} similarCount={0} />);

      expect(screen.queryByText(/similar issues/)).not.toBeInTheDocument();
    });

    it("copies selector to clipboard when Copy Selector button is clicked", () => {
      render(<FindingDetails {...defaultProps} />);

      const copyButton = screen.getByText("📋 Copy Selector");
      fireEvent.click(copyButton);

      expect(mockClipboard.writeText).toHaveBeenCalledWith("img.hero-image");
    });

    it("shows Copied! state after copying selector", () => {
      render(<FindingDetails {...defaultProps} />);

      const copyButton = screen.getByText("📋 Copy Selector");
      fireEvent.click(copyButton);

      expect(screen.getByText("✓ Copied!")).toBeInTheDocument();
    });

    it("resets copied selector state when animation ends", () => {
      render(<FindingDetails {...defaultProps} />);

      // Click to copy - shows "✓ Copied!"
      const copyButton = screen.getByText("📋 Copy Selector");
      fireEvent.click(copyButton);
      expect(screen.getByText("✓ Copied!")).toBeInTheDocument();

      // Trigger animation end - resets to "📋 Copy Selector"
      const copiedButton = screen.getByText("✓ Copied!");
      fireEvent.animationEnd(copiedButton);
      expect(screen.getByText("📋 Copy Selector")).toBeInTheDocument();
    });

    it("renders fix difficulty based on severity", () => {
      render(<FindingDetails {...defaultProps} />);

      // Critical severity should show "Quick Fix"
      expect(screen.getByText("Quick Fix")).toBeInTheDocument();
      expect(screen.getByText("≈ 5-10 min")).toBeInTheDocument();
    });

    it("renders different fix difficulty for moderate severity", () => {
      const finding = makeFinding({ impact: "moderate" });
      render(<FindingDetails {...defaultProps} finding={finding} />);

      expect(screen.getByText("Moderate")).toBeInTheDocument();
      expect(screen.getByText("≈ 10-20 min")).toBeInTheDocument();
    });

    it("renders different fix difficulty for minor severity", () => {
      const finding = makeFinding({ impact: "minor" });
      render(<FindingDetails {...defaultProps} finding={finding} />);

      expect(screen.getByText("Simple")).toBeInTheDocument();
      expect(screen.getByText("≈ 2-5 min")).toBeInTheDocument();
    });

    it("toggles HTML context visibility when Show/Hide Context is clicked", () => {
      render(<FindingDetails {...defaultProps} />);

      const toggleButton = screen.getByText("Show Context");
      fireEvent.click(toggleButton);

      expect(screen.getByText("Hide Context")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Hide Context"));
      expect(screen.getByText("Show Context")).toBeInTheDocument();
    });

    it("renders AI-powered suggestions section", () => {
      render(<FindingDetails {...defaultProps} />);

      expect(screen.getByText("🤖 AI-POWERED SUGGESTIONS")).toBeInTheDocument();
      expect(screen.getByText("Powered by Claude AI")).toBeInTheDocument();
      expect(screen.getByText("Element does not have an alt attribute")).toBeInTheDocument();
    });

    it("renders footer Close button that calls onClose", () => {
      const onClose = vi.fn();
      render(<FindingDetails {...defaultProps} onClose={onClose} />);

      // Find the Close button in the footer (there's also the × button in header)
      const buttons = screen.getAllByText("Close");
      fireEvent.click(buttons[0]);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    describe("with fixSuggestion", () => {
      it("renders fix suggestion when provided", () => {
        const finding = makeFinding({
          fixSuggestion: '<img src="hero.jpg" alt="Hero banner image">'
        });
        render(<FindingDetails {...defaultProps} finding={finding} />);

        expect(screen.getByText("💡 SUGGESTED FIX")).toBeInTheDocument();
        expect(screen.getByText('<img src="hero.jpg" alt="Hero banner image">')).toBeInTheDocument();
      });

      it("renders Copy Fix button when fixSuggestion is provided", () => {
        const finding = makeFinding({
          fixSuggestion: '<img src="hero.jpg" alt="Hero banner image">'
        });
        render(<FindingDetails {...defaultProps} finding={finding} />);

        expect(screen.getAllByText("📋 Copy Fix").length).toBeGreaterThan(0);
      });

      it("copies fix to clipboard when Copy Fix button is clicked", () => {
        const finding = makeFinding({
          fixSuggestion: '<img src="hero.jpg" alt="Hero banner image">'
        });
        render(<FindingDetails {...defaultProps} finding={finding} />);

        const copyButtons = screen.getAllByText("📋 Copy Fix");
        fireEvent.click(copyButtons[0]);

        expect(mockClipboard.writeText).toHaveBeenCalledWith('<img src="hero.jpg" alt="Hero banner image">');
      });

      it("shows Copied! state after copying fix", () => {
        const finding = makeFinding({
          fixSuggestion: '<img src="hero.jpg" alt="Hero banner image">'
        });
        render(<FindingDetails {...defaultProps} finding={finding} />);

        const copyButtons = screen.getAllByText("📋 Copy Fix");
        fireEvent.click(copyButtons[0]);

        // Both buttons should now show "✓ Copied!" (header and suggested fix section)
        expect(screen.getAllByText("✓ Copied!").length).toBeGreaterThan(0);
      });

      it("resets copied fix state when animation ends on header button", () => {
        const finding = makeFinding({
          fixSuggestion: '<img src="hero.jpg" alt="Hero banner image">'
        });
        render(<FindingDetails {...defaultProps} finding={finding} />);

        // Click to copy
        const copyButtons = screen.getAllByText("📋 Copy Fix");
        fireEvent.click(copyButtons[0]);

        // Both buttons show "✓ Copied!"
        const copiedButtons = screen.getAllByText("✓ Copied!");
        expect(copiedButtons.length).toBeGreaterThan(0);

        // Trigger animation end on first button - resets state
        fireEvent.animationEnd(copiedButtons[0]);
        expect(screen.getAllByText("📋 Copy Fix").length).toBeGreaterThan(0);
      });

      it("resets copied fix state when animation ends on suggested fix section button", () => {
        const finding = makeFinding({
          fixSuggestion: '<img src="hero.jpg" alt="Hero banner image">'
        });
        render(<FindingDetails {...defaultProps} finding={finding} />);

        // Click the second copy button (in suggested fix section)
        const copyButtons = screen.getAllByText("📋 Copy Fix");
        fireEvent.click(copyButtons[1]);

        // Both buttons show "✓ Copied!"
        const copiedButtons = screen.getAllByText("✓ Copied!");
        expect(copiedButtons.length).toBe(2);

        // Trigger animation end on second button (suggested fix section) - lines 292-293
        fireEvent.animationEnd(copiedButtons[1]);
        expect(screen.getAllByText("📋 Copy Fix").length).toBe(2);
      });

      it("does not render Generate AI Fix button when fixSuggestion exists", () => {
        const finding = makeFinding({
          fixSuggestion: '<img src="hero.jpg" alt="Hero banner image">'
        });
        render(<FindingDetails {...defaultProps} finding={finding} onGenerateFix={vi.fn()} />);

        expect(screen.queryByText("🤖 Generate AI Fix")).not.toBeInTheDocument();
      });
    });

    describe("with onGenerateFix", () => {
      it("renders Generate AI Fix button when onGenerateFix is provided and no fixSuggestion", () => {
        const onGenerateFix = vi.fn();
        render(<FindingDetails {...defaultProps} onGenerateFix={onGenerateFix} />);

        expect(screen.getByText("🤖 Generate AI Fix")).toBeInTheDocument();
      });

      it("calls onGenerateFix when Generate AI Fix button is clicked", () => {
        const onGenerateFix = vi.fn();
        render(<FindingDetails {...defaultProps} onGenerateFix={onGenerateFix} />);

        const generateButton = screen.getByText("🤖 Generate AI Fix");
        fireEvent.click(generateButton);

        expect(onGenerateFix).toHaveBeenCalledWith(defaultProps.finding);
      });

      it("shows generating state when isGeneratingFix is true", () => {
        render(<FindingDetails {...defaultProps} onGenerateFix={vi.fn()} isGeneratingFix={true} />);

        expect(screen.getByText("⏳ Generating...")).toBeInTheDocument();
      });

      it("disables Generate button when isGeneratingFix is true", () => {
        render(<FindingDetails {...defaultProps} onGenerateFix={vi.fn()} isGeneratingFix={true} />);

        const generateButton = screen.getByText("⏳ Generating...");
        expect(generateButton).toBeDisabled();
      });
    });

    describe("without WCAG tags", () => {
      it("does not render WCAG section when wcagTags is empty", () => {
        const finding = makeFinding({ wcagTags: [] });
        render(<FindingDetails {...defaultProps} finding={finding} />);

        expect(screen.queryByText("WCAG COMPLIANCE")).not.toBeInTheDocument();
      });
    });
  });

  describe("FindingDetailsDrawer", () => {
    it("does not render when isOpen is false", () => {
      render(<FindingDetailsDrawer {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Images must have alternate text")).not.toBeInTheDocument();
    });

    it("renders when isOpen is true", () => {
      render(<FindingDetailsDrawer {...defaultProps} isOpen={true} />);

      expect(screen.getByText("Images must have alternate text")).toBeInTheDocument();
    });

    it("renders backdrop when open", () => {
      const { container } = render(<FindingDetailsDrawer {...defaultProps} isOpen={true} />);

      // Check for backdrop element (has fixed position and background color)
      const backdrop = container.querySelector('[style*="background: rgba(0, 0, 0, 0.4)"]');
      expect(backdrop).toBeInTheDocument();
    });

    it("calls onClose when backdrop is clicked", () => {
      const onClose = vi.fn();
      const { container } = render(<FindingDetailsDrawer {...defaultProps} isOpen={true} onClose={onClose} />);

      const backdrop = container.querySelector('[style*="background: rgba(0, 0, 0, 0.4)"]');
      fireEvent.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
