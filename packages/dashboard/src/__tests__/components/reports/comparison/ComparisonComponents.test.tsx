/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  ChangeIndicator,
  DateRangeCard,
  PeriodCard,
  SeverityChangeCard,
  SummaryBanner,
} from "../../../../components/reports/comparison";

// Mock ScoreCircle used by PeriodCard
vi.mock("../../../../components/charts", () => ({
  ScoreCircle: ({ score, size }: { score: number; size: number }) => (
    <div data-testid="score-circle" data-score={score} data-size={size}>
      {score}
    </div>
  ),
}));

describe("comparison/ChangeIndicator", () => {
  it("shows positive change with green color and up icon", () => {
    const { container } = render(
      <ChangeIndicator scoreChange={10} issueChange={-2} scorePercent={5.5} />
    );

    expect(screen.getByText("+10")).toBeInTheDocument();
    expect(screen.getByText("(+5.5%)")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows negative change with red color and down icon", () => {
    const { container } = render(
      <ChangeIndicator scoreChange={-10} issueChange={2} scorePercent={-5.5} />
    );

    expect(screen.getByText("-10")).toBeInTheDocument();
    expect(screen.getByText("(-5.5%)")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows zero change with gray color and minus icon", () => {
    const { container } = render(
      <ChangeIndicator scoreChange={0} issueChange={0} scorePercent={0} />
    );

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("(0.0%)")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows issue change correctly", () => {
    render(<ChangeIndicator scoreChange={5} issueChange={-3.5} scorePercent={2} />);

    expect(screen.getByText(/3.5 issues/)).toBeInTheDocument();
  });
});

describe("comparison/DateRangeCard", () => {
  it("renders label and range with color", () => {
    render(<DateRangeCard label="Current Period" range="Jan 1 - Jan 15" color="#3b82f6" />);

    expect(screen.getByText("Current Period")).toBeInTheDocument();
    expect(screen.getByText("Jan 1 - Jan 15")).toBeInTheDocument();
  });
});

describe("comparison/PeriodCard", () => {
  it("renders period info with score circle", () => {
    render(
      <PeriodCard
        label="Current"
        score={85}
        issues={4.5}
        scanCount={10}
      />
    );

    expect(screen.getByText("CURRENT")).toBeInTheDocument();
    expect(screen.getByTestId("score-circle")).toHaveAttribute("data-score", "85");
    expect(screen.getByText("Avg 4.5 issues")).toBeInTheDocument();
    expect(screen.getByText("10 scans")).toBeInTheDocument();
  });

  it("shows singular 'scan' for count of 1", () => {
    render(
      <PeriodCard
        label="Previous"
        score={80}
        issues={5}
        scanCount={1}
      />
    );

    expect(screen.getByText("1 scan")).toBeInTheDocument();
  });

  it("applies highlight styling when highlight prop is true", () => {
    const { container } = render(
      <PeriodCard
        label="Current"
        score={90}
        issues={3}
        scanCount={5}
        highlight={true}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveStyle({ background: "#eff6ff" });
  });
});

describe("comparison/SeverityChangeCard", () => {
  it("renders severity info with before/after values", () => {
    render(
      <SeverityChangeCard
        label="Critical"
        before={5}
        after={3}
        color="#dc2626"
      />
    );

    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("5.0 → 3.0")).toBeInTheDocument();
    expect(screen.getByText("-2.0")).toBeInTheDocument();
  });

  it("shows positive change with red color", () => {
    render(
      <SeverityChangeCard
        label="Serious"
        before={2}
        after={5}
        color="#f97316"
      />
    );

    expect(screen.getByText("+3.0")).toHaveStyle({ color: "#ef4444" });
  });

  it("shows zero change with gray color", () => {
    render(
      <SeverityChangeCard
        label="Moderate"
        before={3}
        after={3}
        color="#facc15"
      />
    );

    expect(screen.getByText("0.0")).toHaveStyle({ color: "#64748b" });
  });
});

describe("comparison/SummaryBanner", () => {
  it("shows improvement message with party icon", () => {
    const { container } = render(
      <SummaryBanner
        comparison={{ score: { change: 15, changePercent: 10.5 } }}
      />
    );

    expect(screen.getByText(/Great progress!/)).toBeInTheDocument();
    expect(screen.getByText(/improved by 15 points/)).toBeInTheDocument();
    expect(screen.getByText(/10.5%/)).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows decline message with warning icon", () => {
    const { container } = render(
      <SummaryBanner
        comparison={{ score: { change: -10, changePercent: -8.5 } }}
      />
    );

    expect(screen.getByText(/Score decreased by 10 points/)).toBeInTheDocument();
    expect(screen.getByText(/8.5%/)).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows stable message with minus icon", () => {
    const { container } = render(
      <SummaryBanner
        comparison={{ score: { change: 0, changePercent: 0 } }}
      />
    );

    expect(screen.getByText(/Score remained stable/)).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
