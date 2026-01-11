import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { KPIGrid } from "../../../components/executive/KPIGrid";

describe("executive/KPIGrid", () => {
  it("renders children", () => {
    render(
      <KPIGrid>
        <div>Child 1</div>
        <div>Child 2</div>
      </KPIGrid>
    );

    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
  });

  it("applies default styles", () => {
    const { container } = render(
      <KPIGrid>
        <div>Content</div>
      </KPIGrid>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginBottom: "24px",
    });
  });

  it("applies custom minWidth", () => {
    const { container } = render(
      <KPIGrid minWidth={300}>
        <div>Content</div>
      </KPIGrid>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveStyle({
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    });
  });

  it("applies custom gap", () => {
    const { container } = render(
      <KPIGrid gap={24}>
        <div>Content</div>
      </KPIGrid>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveStyle({ gap: "24px" });
  });

  it("applies custom marginBottom", () => {
    const { container } = render(
      <KPIGrid marginBottom={32}>
        <div>Content</div>
      </KPIGrid>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveStyle({ marginBottom: "32px" });
  });

  it("applies fixed columns when provided", () => {
    const { container } = render(
      <KPIGrid columns={4}>
        <div>Content</div>
      </KPIGrid>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveStyle({
      gridTemplateColumns: "repeat(4, 1fr)",
    });
  });

  it("uses auto-fit when columns is not provided", () => {
    const { container } = render(
      <KPIGrid>
        <div>Content</div>
      </KPIGrid>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveStyle({
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    });
  });

  it("renders multiple children in grid", () => {
    render(
      <KPIGrid columns={3}>
        <div>Card 1</div>
        <div>Card 2</div>
        <div>Card 3</div>
        <div>Card 4</div>
      </KPIGrid>
    );

    expect(screen.getByText("Card 1")).toBeInTheDocument();
    expect(screen.getByText("Card 2")).toBeInTheDocument();
    expect(screen.getByText("Card 3")).toBeInTheDocument();
    expect(screen.getByText("Card 4")).toBeInTheDocument();
  });

  it("applies all custom props together", () => {
    const { container } = render(
      <KPIGrid columns={2} gap={20} marginBottom={40}>
        <div>Content</div>
      </KPIGrid>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "20px",
      marginBottom: "40px",
    });
  });
});
