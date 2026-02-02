import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressRow } from "../../../components/ui/ProgressRow";

describe("ui/ProgressRow", () => {
  it("renders label and value with icon", () => {
    render(
      <ProgressRow
        label="Issues Fixed"
        value={15}
        icon={<span data-testid="icon">✓</span>}
        color="#10b981"
      />
    );
    expect(screen.getByText("Issues Fixed")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders string value", () => {
    render(
      <ProgressRow
        label="Status"
        value="Complete"
        icon={<span>•</span>}
        color="#3b82f6"
      />
    );
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("applies color to value text", () => {
    render(
      <ProgressRow
        label="Critical"
        value={5}
        icon={<span>!</span>}
        color="#ef4444"
      />
    );
    const valueElement = screen.getByText("5");
    expect(valueElement).toHaveStyle({ color: "#ef4444" });
  });
});
