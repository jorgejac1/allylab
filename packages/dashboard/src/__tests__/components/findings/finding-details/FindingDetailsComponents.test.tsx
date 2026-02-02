/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  Section,
  AISuggestion,
  FIX_DIFFICULTY,
} from "../../../../components/findings/finding-details";

describe("finding-details/Section", () => {
  it("renders title and children", () => {
    render(
      <Section title="Test Section">
        <div data-testid="child">Child content</div>
      </Section>
    );

    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <Section title="Test" subtitle="Test subtitle">
        <span>Content</span>
      </Section>
    );

    expect(screen.getByText("Test subtitle")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(
      <Section title="Test">
        <span>Content</span>
      </Section>
    );

    expect(screen.queryByText("Test subtitle")).not.toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(
      <Section title="Test" action={<button>Action Button</button>}>
        <span>Content</span>
      </Section>
    );

    expect(screen.getByText("Action Button")).toBeInTheDocument();
  });

  it("accepts ReactNode as title", () => {
    render(
      <Section title={<span data-testid="custom-title">Custom Title</span>}>
        <span>Content</span>
      </Section>
    );

    expect(screen.getByTestId("custom-title")).toBeInTheDocument();
  });

  it("wraps children with flexbox layout", () => {
    const { container } = render(
      <Section title="Test">
        <span>Item 1</span>
        <span>Item 2</span>
      </Section>
    );

    const childWrapper = container.querySelector('[style*="display: flex"]');
    expect(childWrapper).toBeInTheDocument();
  });
});

describe("finding-details/AISuggestion", () => {
  it("renders rank, type, and text", () => {
    render(
      <AISuggestion
        rank={1}
        type="RECOMMENDED"
        color="#2563eb"
        text="Test suggestion text"
      />
    );

    expect(screen.getByText(/1 RECOMMENDED/)).toBeInTheDocument();
    expect(screen.getByText("Test suggestion text")).toBeInTheDocument();
  });

  it("renders trophy icon for rank 1", () => {
    const { container } = render(
      <AISuggestion rank={1} type="RECOMMENDED" color="#2563eb" text="Test" />
    );

    // Trophy icon should be present (lucide-react renders as SVG)
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders medal icon for rank 2", () => {
    const { container } = render(
      <AISuggestion rank={2} type="ALTERNATIVE" color="#10b981" text="Test" />
    );

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders medal icon for rank 3", () => {
    const { container } = render(
      <AISuggestion rank={3} type="ADVANCED" color="#f59e0b" text="Test" />
    );

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders award icon for rank > 3", () => {
    const { container } = render(
      <AISuggestion rank={5} type="ADVANCED" color="#f59e0b" text="Test" />
    );

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies color to badge", () => {
    const { container } = render(
      <AISuggestion rank={1} type="RECOMMENDED" color="#2563eb" text="Test" />
    );

    // The badge span should have the color applied
    const badge = container.querySelector('span[style]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ color: '#2563eb' });
  });

  it("renders correct types", () => {
    const { rerender } = render(
      <AISuggestion rank={1} type="RECOMMENDED" color="#2563eb" text="Test" />
    );
    expect(screen.getByText(/1 RECOMMENDED/)).toBeInTheDocument();

    rerender(
      <AISuggestion rank={2} type="ALTERNATIVE" color="#10b981" text="Test" />
    );
    expect(screen.getByText(/2 ALTERNATIVE/)).toBeInTheDocument();

    rerender(
      <AISuggestion rank={3} type="ADVANCED" color="#f59e0b" text="Test" />
    );
    expect(screen.getByText(/3 ADVANCED/)).toBeInTheDocument();
  });
});

describe("finding-details/FIX_DIFFICULTY", () => {
  it("has correct mapping for critical severity", () => {
    expect(FIX_DIFFICULTY.critical).toEqual({
      label: "Quick Fix",
      time: "5-10 min",
      color: "#10b981",
    });
  });

  it("has correct mapping for serious severity", () => {
    expect(FIX_DIFFICULTY.serious).toEqual({
      label: "Moderate",
      time: "15-30 min",
      color: "#f59e0b",
    });
  });

  it("has correct mapping for moderate severity", () => {
    expect(FIX_DIFFICULTY.moderate).toEqual({
      label: "Moderate",
      time: "10-20 min",
      color: "#f59e0b",
    });
  });

  it("has correct mapping for minor severity", () => {
    expect(FIX_DIFFICULTY.minor).toEqual({
      label: "Simple",
      time: "2-5 min",
      color: "#10b981",
    });
  });
});
