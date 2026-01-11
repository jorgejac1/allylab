// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FindingRow } from "../../../components/findings/FindingRow";
import type { TrackedFinding } from "../../../types";

// Mock UI components
vi.mock("../../../components/ui", () => ({
  SeverityBadge: ({ severity }: { severity: string }) => <span data-testid="severity-badge">{severity}</span>,
  StatusBadge: ({ status }: { status: string }) => <span data-testid="status-badge">{status}</span>,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

describe("findings/FindingRow", () => {
  const baseFinding: TrackedFinding = {
    id: "f1",
    ruleId: "r1",
    ruleTitle: "Test Rule",
    description: "Test description",
    impact: "critical",
    selector: "div.test-selector",
    html: "<div/>",
    helpUrl: "https://test.com",
    wcagTags: ["WCAG2AA", "WCAG2AAA"],
    status: "new",
    fingerprint: "fp1",
    page: "https://example.com/page1",
  };

  it("renders severity badge", () => {
    render(
      <table><tbody>
        <FindingRow finding={baseFinding} onViewDetails={vi.fn()} />
      </tbody></table>
    );

    expect(screen.getByTestId("severity-badge")).toHaveTextContent("critical");
  });

  it("renders status badge", () => {
    render(
      <table><tbody>
        <FindingRow finding={baseFinding} onViewDetails={vi.fn()} />
      </tbody></table>
    );

    expect(screen.getByTestId("status-badge")).toHaveTextContent("new");
  });

  it("renders rule title", () => {
    render(
      <table><tbody>
        <FindingRow finding={baseFinding} onViewDetails={vi.fn()} />
      </tbody></table>
    );

    expect(screen.getByText("Test Rule")).toBeInTheDocument();
  });

  it("renders full description when short", () => {
    render(
      <table><tbody>
        <FindingRow finding={baseFinding} onViewDetails={vi.fn()} />
      </tbody></table>
    );

    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("truncates long description", () => {
    const longDescription = "a".repeat(150);
    const findingWithLongDesc = { ...baseFinding, description: longDescription };

    render(
      <table><tbody>
        <FindingRow finding={findingWithLongDesc} onViewDetails={vi.fn()} />
      </tbody></table>
    );

    const truncated = screen.getByText(new RegExp(longDescription.slice(0, 50)));
    expect(truncated.textContent).toContain("...");
  });

  it("displays WCAG tags", () => {
    render(
      <table><tbody>
        <FindingRow finding={baseFinding} onViewDetails={vi.fn()} />
      </tbody></table>
    );

    expect(screen.getByText("WCAG2AA, WCAG2AAA")).toBeInTheDocument();
  });

  it("displays dash when no WCAG tags", () => {
    const findingWithoutTags = { ...baseFinding, wcagTags: [] };

    render(
      <table><tbody>
        <FindingRow finding={findingWithoutTags} onViewDetails={vi.fn()} />
      </tbody></table>
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders selector in code element", () => {
    render(
      <table><tbody>
        <FindingRow finding={baseFinding} onViewDetails={vi.fn()} />
      </tbody></table>
    );

    const code = screen.getByText("div.test-selector");
    expect(code.tagName).toBe("CODE");
  });

  it("truncates long selector", () => {
    const longSelector = "a".repeat(50);
    const findingWithLongSelector = { ...baseFinding, selector: longSelector };

    render(
      <table><tbody>
        <FindingRow finding={findingWithLongSelector} onViewDetails={vi.fn()} />
      </tbody></table>
    );

    const code = screen.getByText(new RegExp(longSelector.slice(0, 20)));
    expect(code.textContent).toContain("...");
  });

  it("renders page link when page is provided", () => {
    render(
      <table><tbody>
        <FindingRow finding={baseFinding} onViewDetails={vi.fn()} />
      </tbody></table>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/page1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveTextContent("/page1");
  });

  it("does not render page column when page is not provided", () => {
    const findingWithoutPage = { ...baseFinding, page: undefined };

    render(
      <table><tbody>
        <FindingRow finding={findingWithoutPage} onViewDetails={vi.fn()} />
      </tbody></table>
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders Details button and calls onViewDetails", () => {
    const onViewDetails = vi.fn();

    render(
      <table><tbody>
        <FindingRow finding={baseFinding} onViewDetails={onViewDetails} />
      </tbody></table>
    );

    const button = screen.getByText("Details");
    fireEvent.click(button);

    expect(onViewDetails).toHaveBeenCalledWith(baseFinding);
  });

  it("renders checkbox when onSelect is provided", () => {
    const onSelect = vi.fn();

    render(
      <table><tbody>
        <FindingRow finding={baseFinding} onViewDetails={vi.fn()} onSelect={onSelect} selected={false} />
      </tbody></table>
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("does not render checkbox when onSelect is not provided", () => {
    render(
      <table><tbody>
        <FindingRow finding={baseFinding} onViewDetails={vi.fn()} />
      </tbody></table>
    );

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("checkbox reflects selected state", () => {
    render(
      <table><tbody>
        <FindingRow finding={baseFinding} onViewDetails={vi.fn()} onSelect={vi.fn()} selected={true} />
      </tbody></table>
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("calls onSelect when checkbox is clicked", () => {
    const onSelect = vi.fn();

    render(
      <table><tbody>
        <FindingRow finding={baseFinding} onViewDetails={vi.fn()} onSelect={onSelect} selected={false} />
      </tbody></table>
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onSelect).toHaveBeenCalledWith("f1", true);
  });

  it("calls onSelect with false when unchecking", () => {
    const onSelect = vi.fn();

    render(
      <table><tbody>
        <FindingRow finding={baseFinding} onViewDetails={vi.fn()} onSelect={onSelect} selected={true} />
      </tbody></table>
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onSelect).toHaveBeenCalledWith("f1", false);
  });
});
