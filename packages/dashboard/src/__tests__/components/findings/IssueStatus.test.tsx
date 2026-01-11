// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { IssueStatus, IssueStatusSummary } from "../../../components/findings/IssueStatus";

describe("findings/IssueStatus", () => {
  describe("IssueStatus component", () => {
    it("renders new status badge", () => {
      render(<IssueStatus status="new" />);

      expect(screen.getByText("🆕")).toBeInTheDocument();
      expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("renders recurring status badge", () => {
      render(<IssueStatus status="recurring" />);

      expect(screen.getByText("🔄")).toBeInTheDocument();
      expect(screen.getByText("Recurring")).toBeInTheDocument();
    });

    it("renders fixed status badge", () => {
      render(<IssueStatus status="fixed" />);

      expect(screen.getByText("✅")).toBeInTheDocument();
      expect(screen.getByText("Fixed")).toBeInTheDocument();
    });

    it("renders small size badge", () => {
      const { container } = render(<IssueStatus status="new" size="sm" />);

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({
        padding: "2px 6px",
        fontSize: "10px",
      });
    });

    it("renders medium size badge", () => {
      const { container } = render(<IssueStatus status="new" size="md" />);

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({
        padding: "4px 10px",
        fontSize: "12px",
      });
    });

    it("renders large size badge", () => {
      const { container } = render(<IssueStatus status="new" size="lg" />);

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({
        padding: "6px 14px",
        fontSize: "14px",
      });
    });

    it("hides label when showLabel is false", () => {
      render(<IssueStatus status="new" showLabel={false} />);

      expect(screen.getByText("🆕")).toBeInTheDocument();
      expect(screen.queryByText("New")).not.toBeInTheDocument();
    });

    it("shows label by default", () => {
      render(<IssueStatus status="new" />);

      expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("applies correct styling for new status", () => {
      const { container } = render(<IssueStatus status="new" />);

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({
        background: "#dbeafe",
        color: "#1d4ed8",
      });
    });

    it("applies correct styling for recurring status", () => {
      const { container } = render(<IssueStatus status="recurring" />);

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({
        background: "#fef3c7",
        color: "#b45309",
      });
    });

    it("applies correct styling for fixed status", () => {
      const { container } = render(<IssueStatus status="fixed" />);

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({
        background: "#dcfce7",
        color: "#15803d",
      });
    });
  });

  describe("IssueStatusSummary component", () => {
    it("renders all status counts", () => {
      render(<IssueStatusSummary newCount={5} recurringCount={3} fixedCount={2} />);

      expect(screen.getByText("🆕")).toBeInTheDocument();
      expect(screen.getByText("🔄")).toBeInTheDocument();
      expect(screen.getByText("✅")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("displays total count", () => {
      render(<IssueStatusSummary newCount={5} recurringCount={3} fixedCount={2} />);

      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("Total Tracked")).toBeInTheDocument();
    });

    it("displays status labels", () => {
      render(<IssueStatusSummary newCount={5} recurringCount={3} fixedCount={2} />);

      expect(screen.getByText("New")).toBeInTheDocument();
      expect(screen.getByText("Recurring")).toBeInTheDocument();
      expect(screen.getByText("Fixed")).toBeInTheDocument();
    });

    it("calculates correct total with zero counts", () => {
      render(<IssueStatusSummary newCount={0} recurringCount={0} fixedCount={0} />);

      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBeGreaterThanOrEqual(4); // new, recurring, fixed, total
      expect(screen.getByText("Total Tracked")).toBeInTheDocument();
    });

    it("handles large counts", () => {
      render(<IssueStatusSummary newCount={100} recurringCount={50} fixedCount={25} />);

      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("175")).toBeInTheDocument();
    });

    it("applies correct styling", () => {
      const { container } = render(<IssueStatusSummary newCount={5} recurringCount={3} fixedCount={2} />);

      const summaryContainer = container.firstChild as HTMLElement;
      expect(summaryContainer).toHaveStyle({
        display: "flex",
        gap: "16px",
        padding: "12px 16px",
        background: "rgb(248, 250, 252)",
        borderRadius: "8px",
      });
    });
  });
});
