/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import {
  FormField,
  WcagTagButton,
  SeverityBadge,
  RulesHeader,
  RuleItem,
} from "../../../../components/settings/custom-rules-manager";
import {
  RULE_TYPES,
  SEVERITIES,
  OPERATORS,
  WCAG_TAGS,
  SEVERITY_COLORS,
} from "../../../../components/settings/custom-rules-manager/constants";

// Mock UI components
vi.mock("../../../../components/ui", () => ({
  Button: ({ children, onClick, variant, size, disabled }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
}));

describe("custom-rules-manager/FormField", () => {
  it("renders label text", () => {
    render(
      <FormField label="Test Label">
        <input />
      </FormField>
    );
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <FormField label="Test">
        <input data-testid="child-input" />
      </FormField>
    );
    expect(screen.getByTestId("child-input")).toBeInTheDocument();
  });

  it("uses label element", () => {
    const { container } = render(
      <FormField label="Test">
        <span>Content</span>
      </FormField>
    );
    expect(container.querySelector("label")).toBeInTheDocument();
  });
});

describe("custom-rules-manager/WcagTagButton", () => {
  const defaultProps = {
    tag: "wcag2a",
    isSelected: false,
    onClick: vi.fn(),
  };

  it("renders tag text", () => {
    render(<WcagTagButton {...defaultProps} />);
    expect(screen.getByText("wcag2a")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<WcagTagButton {...defaultProps} onClick={onClick} />);

    fireEvent.click(screen.getByText("wcag2a"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("has aria-pressed false when not selected", () => {
    render(<WcagTagButton {...defaultProps} isSelected={false} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("has aria-pressed true when selected", () => {
    render(<WcagTagButton {...defaultProps} isSelected={true} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("applies selected styling when selected", () => {
    const { container } = render(<WcagTagButton {...defaultProps} isSelected={true} />);
    const button = container.firstChild as HTMLElement;
    expect(button).toHaveStyle({ background: "#eff6ff" });
  });

  it("applies unselected styling when not selected", () => {
    const { container } = render(<WcagTagButton {...defaultProps} isSelected={false} />);
    const button = container.firstChild as HTMLElement;
    expect(button).toHaveStyle({ background: "#fff" });
  });
});

describe("custom-rules-manager/SeverityBadge", () => {
  it("renders critical severity", () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText("critical")).toBeInTheDocument();
  });

  it("renders serious severity", () => {
    render(<SeverityBadge severity="serious" />);
    expect(screen.getByText("serious")).toBeInTheDocument();
  });

  it("renders moderate severity", () => {
    render(<SeverityBadge severity="moderate" />);
    expect(screen.getByText("moderate")).toBeInTheDocument();
  });

  it("renders minor severity", () => {
    render(<SeverityBadge severity="minor" />);
    expect(screen.getByText("minor")).toBeInTheDocument();
  });

  it("applies correct color for critical", () => {
    const { container } = render(<SeverityBadge severity="critical" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveStyle({ color: SEVERITY_COLORS.critical });
  });

  it("applies correct color for minor", () => {
    const { container } = render(<SeverityBadge severity="minor" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveStyle({ color: SEVERITY_COLORS.minor });
  });
});

describe("custom-rules-manager/RulesHeader", () => {
  const defaultProps = {
    enabledRules: 3,
    totalRules: 5,
    rulesCount: 5,
    fileInputRef: createRef<HTMLInputElement>(),
    onImport: vi.fn(),
    onExport: vi.fn(),
    onNewRule: vi.fn(),
  };

  it("renders title", () => {
    render(<RulesHeader {...defaultProps} />);
    expect(screen.getByText("Custom Accessibility Rules")).toBeInTheDocument();
  });

  it("renders enabled/total count", () => {
    render(<RulesHeader {...defaultProps} />);
    expect(screen.getByText(/3\/5 enabled/)).toBeInTheDocument();
  });

  it("renders Import button", () => {
    render(<RulesHeader {...defaultProps} />);
    expect(screen.getByText("Import")).toBeInTheDocument();
  });

  it("renders Export button", () => {
    render(<RulesHeader {...defaultProps} />);
    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("renders New Rule button", () => {
    render(<RulesHeader {...defaultProps} />);
    expect(screen.getByText("New Rule")).toBeInTheDocument();
  });

  it("calls onNewRule when New Rule clicked", () => {
    const onNewRule = vi.fn();
    render(<RulesHeader {...defaultProps} onNewRule={onNewRule} />);

    fireEvent.click(screen.getByText("New Rule"));
    expect(onNewRule).toHaveBeenCalledTimes(1);
  });

  it("calls onExport when Export clicked", () => {
    const onExport = vi.fn();
    render(<RulesHeader {...defaultProps} onExport={onExport} />);

    fireEvent.click(screen.getByText("Export"));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("disables Export when no rules", () => {
    render(<RulesHeader {...defaultProps} rulesCount={0} />);
    expect(screen.getByText("Export").closest("button")).toBeDisabled();
  });

  it("has file input with accept .json", () => {
    render(<RulesHeader {...defaultProps} />);
    const input = screen.getByLabelText("Import rules file");
    expect(input).toHaveAttribute("accept", ".json");
  });

  it("renders inside Card", () => {
    render(<RulesHeader {...defaultProps} />);
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });
});

describe("custom-rules-manager/RuleItem", () => {
  const defaultRule = {
    id: "rule-1",
    name: "Test Rule",
    description: "A test rule for accessibility checking",
    type: "selector" as const,
    selector: ".test-selector",
    severity: "critical" as const,
    condition: {},
    message: "Test message",
    wcagTags: ["wcag2a", "wcag2aa"],
    enabled: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  };

  const defaultProps = {
    rule: defaultRule,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggle: vi.fn(),
  };

  it("renders rule name", () => {
    render(<RuleItem {...defaultProps} />);
    expect(screen.getByText("Test Rule")).toBeInTheDocument();
  });

  it("renders selector", () => {
    render(<RuleItem {...defaultProps} />);
    expect(screen.getByText(".test-selector")).toBeInTheDocument();
  });

  it("renders severity badge", () => {
    render(<RuleItem {...defaultProps} />);
    expect(screen.getByText("critical")).toBeInTheDocument();
  });

  it("renders WCAG tags", () => {
    render(<RuleItem {...defaultProps} />);
    expect(screen.getByText(/wcag2a, wcag2aa/)).toBeInTheDocument();
  });

  it("truncates long WCAG tags list", () => {
    const rule = {
      ...defaultRule,
      wcagTags: ["wcag2a", "wcag2aa", "wcag2aaa", "wcag21a"],
    };
    render(<RuleItem {...defaultProps} rule={rule} />);
    expect(screen.getByText(/\+2/)).toBeInTheDocument();
  });

  it("truncates long selectors", () => {
    const rule = {
      ...defaultRule,
      selector: "this-is-a-very-long-selector-that-should-be-truncated-for-display",
    };
    render(<RuleItem {...defaultProps} rule={rule} />);
    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
  });

  it("renders enabled checkbox", () => {
    render(<RuleItem {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("renders disabled checkbox when rule is disabled", () => {
    const rule = { ...defaultRule, enabled: false };
    render(<RuleItem {...defaultProps} rule={rule} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("calls onToggle when checkbox clicked", () => {
    const onToggle = vi.fn();
    render(<RuleItem {...defaultProps} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders Edit button with aria-label", () => {
    render(<RuleItem {...defaultProps} />);
    expect(screen.getByLabelText("Edit Test Rule")).toBeInTheDocument();
  });

  it("renders Delete button with aria-label", () => {
    render(<RuleItem {...defaultProps} />);
    expect(screen.getByLabelText("Delete Test Rule")).toBeInTheDocument();
  });

  it("calls onEdit when Edit clicked", () => {
    const onEdit = vi.fn();
    render(<RuleItem {...defaultProps} onEdit={onEdit} />);

    fireEvent.click(screen.getByLabelText("Edit Test Rule"));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete when Delete clicked", () => {
    const onDelete = vi.fn();
    render(<RuleItem {...defaultProps} onDelete={onDelete} />);

    fireEvent.click(screen.getByLabelText("Delete Test Rule"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("applies reduced opacity when disabled", () => {
    const rule = { ...defaultRule, enabled: false };
    const { container } = render(<RuleItem {...defaultProps} rule={rule} />);
    const ruleDiv = container.firstChild as HTMLElement;
    expect(ruleDiv).toHaveStyle({ opacity: "0.7" });
  });
});

describe("custom-rules-manager/constants", () => {
  it("has correct RULE_TYPES", () => {
    expect(RULE_TYPES).toHaveLength(4);
    expect(RULE_TYPES.map(t => t.value)).toEqual(["selector", "attribute", "content", "structure"]);
  });

  it("has correct SEVERITIES", () => {
    expect(SEVERITIES).toHaveLength(4);
    expect(SEVERITIES.map(s => s.value)).toEqual(["critical", "serious", "moderate", "minor"]);
  });

  it("has correct OPERATORS", () => {
    expect(OPERATORS).toHaveLength(6);
    expect(OPERATORS.map(o => o.value)).toContain("exists");
    expect(OPERATORS.map(o => o.value)).toContain("contains");
  });

  it("has correct WCAG_TAGS", () => {
    expect(WCAG_TAGS).toContain("wcag2a");
    expect(WCAG_TAGS).toContain("wcag21aa");
    expect(WCAG_TAGS).toContain("best-practice");
  });

  it("has correct SEVERITY_COLORS", () => {
    expect(SEVERITY_COLORS.critical).toBe("#dc2626");
    expect(SEVERITY_COLORS.serious).toBe("#ea580c");
    expect(SEVERITY_COLORS.moderate).toBe("#ca8a04");
    expect(SEVERITY_COLORS.minor).toBe("#2563eb");
  });
});
