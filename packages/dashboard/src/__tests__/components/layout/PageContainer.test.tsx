// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PageContainer } from "../../../components/layout/PageContainer";

describe("layout/PageContainer", () => {
  it("renders children content", () => {
    render(
      <PageContainer>
        <div>Page Content</div>
      </PageContainer>
    );

    expect(screen.getByText("Page Content")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(
      <PageContainer title="Test Page">
        <div>Content</div>
      </PageContainer>
    );

    expect(screen.getByText("Test Page")).toBeInTheDocument();
  });

  it("does not render title when not provided", () => {
    render(
      <PageContainer>
        <div>Content</div>
      </PageContainer>
    );

    const heading = screen.queryByRole("heading");
    expect(heading).not.toBeInTheDocument();
  });

  it("renders subtitle when provided with title", () => {
    render(
      <PageContainer title="Test Page" subtitle="Page description">
        <div>Content</div>
      </PageContainer>
    );

    expect(screen.getByText("Page description")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(
      <PageContainer title="Test Page">
        <div>Content</div>
      </PageContainer>
    );

    expect(screen.queryByText("Page description")).not.toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    const actions = <button>Action Button</button>;

    render(
      <PageContainer actions={actions}>
        <div>Content</div>
      </PageContainer>
    );

    expect(screen.getByText("Action Button")).toBeInTheDocument();
  });

  it("does not render actions when not provided", () => {
    render(
      <PageContainer title="Test Page">
        <div>Content</div>
      </PageContainer>
    );

    expect(screen.queryByText("Action Button")).not.toBeInTheDocument();
  });

  it("renders header when only title is provided", () => {
    const { container } = render(
      <PageContainer title="Test Page">
        <div>Content</div>
      </PageContainer>
    );

    const header = container.querySelector('div[style*="justify-content: space-between"]');
    expect(header).toBeInTheDocument();
    expect(screen.getByText("Test Page")).toBeInTheDocument();
  });

  it("renders header when only actions are provided", () => {
    const actions = <button>Action</button>;

    const { container } = render(
      <PageContainer actions={actions}>
        <div>Content</div>
      </PageContainer>
    );

    const header = container.querySelector('div[style*="justify-content: space-between"]');
    expect(header).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("does not render header when neither title nor actions provided", () => {
    const { container } = render(
      <PageContainer>
        <div>Content</div>
      </PageContainer>
    );

    const header = container.querySelector('div[style*="justify-content: space-between"]');
    expect(header).not.toBeInTheDocument();
  });

  it("renders with custom maxWidth", () => {
    const { container } = render(
      <PageContainer maxWidth={800}>
        <div>Content</div>
      </PageContainer>
    );

    const innerDiv = container.querySelector('div[style*="max-width"]');
    expect(innerDiv).toHaveStyle({ maxWidth: 800 });
  });

  it("renders with default maxWidth when not provided", () => {
    const { container } = render(
      <PageContainer>
        <div>Content</div>
      </PageContainer>
    );

    const innerDiv = container.querySelector('div[style*="max-width"]');
    expect(innerDiv).toHaveStyle({ maxWidth: 1400 });
  });

  it("renders title, subtitle and actions together", () => {
    const actions = (
      <>
        <button>Button 1</button>
        <button>Button 2</button>
      </>
    );

    render(
      <PageContainer title="Test Page" subtitle="Description" actions={actions}>
        <div>Content</div>
      </PageContainer>
    );

    expect(screen.getByText("Test Page")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Button 1")).toBeInTheDocument();
    expect(screen.getByText("Button 2")).toBeInTheDocument();
  });

  it("applies correct styling to outer container", () => {
    const { container } = render(
      <PageContainer>
        <div>Content</div>
      </PageContainer>
    );

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveStyle({
      flex: 1,
      padding: "24px",
      background: "#f8fafc",
      minHeight: "calc(100vh - 120px)",
      overflow: "auto",
    });
  });

  it("renders subtitle only when title is also present", () => {
    render(
      <PageContainer subtitle="Description only">
        <div>Content</div>
      </PageContainer>
    );

    // Subtitle should not appear without title (title condition fails first)
    expect(screen.queryByText("Description only")).not.toBeInTheDocument();
  });
});
