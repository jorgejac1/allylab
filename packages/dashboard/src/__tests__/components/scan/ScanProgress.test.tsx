// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ScanProgress } from "../../../components/scan/ScanProgress";

describe("components/scan/ScanProgress", () => {
  it("returns null when complete", () => {
    const { container } = render(<ScanProgress percent={100} message="done" isComplete />);
    expect(container.firstChild).toBeNull();
  });

  it("renders spinner, message, and rounded percent", () => {
    render(<ScanProgress percent={42.4} message="Scanning..." isComplete={false} />);
    expect(screen.getByText("Scanning...")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });
});
