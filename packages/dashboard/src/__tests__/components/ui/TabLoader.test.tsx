import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TabLoader } from "../../../components/ui/TabLoader";

describe("ui/TabLoader", () => {
  it("renders spinner", () => {
    const { container } = render(<TabLoader />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders optional message", () => {
    render(<TabLoader message="Loading content..." />);
    expect(screen.getByText("Loading content...")).toBeInTheDocument();
  });

  it("does not render message when not provided", () => {
    const { container } = render(<TabLoader />);
    const spans = container.querySelectorAll("span");
    const messageSpan = Array.from(spans).find(
      (span) => span.textContent && !span.textContent.includes("@keyframes")
    );
    expect(messageSpan).toBeUndefined();
  });

  it("applies custom size", () => {
    const { container } = render(<TabLoader size={32} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });
});
