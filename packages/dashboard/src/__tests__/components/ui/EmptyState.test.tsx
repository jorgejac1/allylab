import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EmptyState } from "../../../components/ui/EmptyState";

describe("ui/EmptyState", () => {
  it("renders title and optional description", () => {
    render(<EmptyState title="Nothing" description="Add items" />);
    expect(screen.getByText("Nothing")).toBeInTheDocument();
    expect(screen.getByText("Add items")).toBeInTheDocument();
  });

  it("renders action button when provided", () => {
    const onClick = vi.fn();
    render(<EmptyState title="Empty" action={{ label: "Create", onClick }} />);
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onClick).toHaveBeenCalled();
  });
});
