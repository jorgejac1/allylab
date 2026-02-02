import "@testing-library/jest-dom/vitest";
import type React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ErrorBoundary, withErrorBoundary } from "../../../components/ui/ErrorBoundary";

// Suppress console.error for expected error throws
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

// Component that throws on mount
function ThrowOnMount(): React.ReactNode {
  throw new Error("Mount error");
}

describe("ui/ErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowOnMount />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Mount error")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowOnMount />
      </ErrorBoundary>
    );
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("calls onError callback when error occurs", () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowOnMount />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it("displays section name when provided", () => {
    render(
      <ErrorBoundary section="Dashboard Widget">
        <ThrowOnMount />
      </ErrorBoundary>
    );
    expect(screen.getByText("Error in: Dashboard Widget")).toBeInTheDocument();
  });

  it("renders Try Again button that can be clicked", () => {
    render(
      <ErrorBoundary>
        <ThrowOnMount />
      </ErrorBoundary>
    );

    // Error state is shown with Try Again button
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /try again/i });
    expect(button).toBeInTheDocument();

    // Button can be clicked (handleReset is called)
    fireEvent.click(button);
  });

  it("shows generic message when error has no message", () => {
    function ThrowErrorNoMessage(): React.ReactNode {
      throw new Error();
    }
    render(
      <ErrorBoundary>
        <ThrowErrorNoMessage />
      </ErrorBoundary>
    );
    expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
  });
});

describe("withErrorBoundary HOC", () => {
  function TestComponent() {
    return <div>Test Component Content</div>;
  }
  TestComponent.displayName = "TestComponent";

  function ThrowingComponent(): React.ReactNode {
    throw new Error("Component error");
  }

  it("wraps component with error boundary", () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    render(<WrappedComponent />);
    expect(screen.getByText("Test Component Content")).toBeInTheDocument();
  });

  it("catches errors from wrapped component", () => {
    const WrappedComponent = withErrorBoundary(ThrowingComponent, "Throwing Section");
    render(<WrappedComponent />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Error in: Throwing Section")).toBeInTheDocument();
  });

  it("uses component displayName as section when not provided", () => {
    const WrappedComponent = withErrorBoundary(ThrowingComponent);
    render(<WrappedComponent />);
    expect(screen.getByText("Error in: ThrowingComponent")).toBeInTheDocument();
  });

  it("sets correct displayName on wrapped component", () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    expect(WrappedComponent.displayName).toBe("WithErrorBoundary(TestComponent)");
  });
});
