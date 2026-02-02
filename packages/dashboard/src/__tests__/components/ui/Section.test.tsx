import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Section } from "../../../components/ui/Section";

describe("ui/Section", () => {
  it("renders title and children", () => {
    render(
      <Section title="Test Section">
        <div>Content</div>
      </Section>
    );
    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders optional subtitle", () => {
    render(
      <Section title="Title" subtitle="Subtitle text">
        <div>Content</div>
      </Section>
    );
    expect(screen.getByText("Subtitle text")).toBeInTheDocument();
  });

  it("renders optional action slot", () => {
    render(
      <Section title="Title" action={<button>Action</button>}>
        <div>Content</div>
      </Section>
    );
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("applies className when provided", () => {
    const { container } = render(
      <Section title="Title" className="custom-class">
        <div>Content</div>
      </Section>
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
