import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatCard } from "../../../components/ui/StatCard";

describe("ui/StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Total Count" value={42} />);
    expect(screen.getByText("Total Count")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders string value", () => {
    render(<StatCard label="Status" value="Active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders prefix when provided", () => {
    render(<StatCard label="Change" value={10} prefix="+" />);
    // Prefix and value are rendered together in the same element
    expect(screen.getByText(/\+10/)).toBeInTheDocument();
  });

  it("renders suffix when provided", () => {
    render(<StatCard label="Score" value={85} suffix="/100" />);
    expect(screen.getByText("/100")).toBeInTheDocument();
  });

  it("applies custom color when provided", () => {
    render(<StatCard label="Score" value={90} color="#10b981" />);
    const valueContainer = screen.getByText("90").closest("div");
    expect(valueContainer).toHaveStyle({ color: "#10b981" });
  });

  it("uses default color when not provided", () => {
    render(<StatCard label="Score" value={50} />);
    const valueContainer = screen.getByText("50").closest("div");
    expect(valueContainer).toHaveStyle({ color: "#0f172a" });
  });
});
