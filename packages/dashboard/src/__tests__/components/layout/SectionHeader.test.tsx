// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { BarChart3, Search, Zap, Palette } from "lucide-react";

describe("layout/SectionHeader", () => {
  it("renders title", () => {
    render(<SectionHeader title="Section Title" />);

    expect(screen.getByText("Section Title")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(<SectionHeader title="Section Title" icon={<BarChart3 size={20} data-testid="section-icon" />} />);

    expect(screen.getByTestId("section-icon")).toBeInTheDocument();
  });

  it("does not render icon when not provided", () => {
    const { container } = render(<SectionHeader title="Section Title" />);

    // No SVG icon should be rendered when icon prop is not provided
    const svgElements = container.querySelectorAll("svg");
    expect(svgElements.length).toBe(0);
  });

  it("renders subtitle when provided", () => {
    render(<SectionHeader title="Section Title" subtitle="Section description" />);

    expect(screen.getByText("Section description")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(<SectionHeader title="Section Title" />);

    const subtitle = screen.queryByText("Section description");
    expect(subtitle).not.toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    const actions = <button>Action Button</button>;

    render(<SectionHeader title="Section Title" actions={actions} />);

    expect(screen.getByText("Action Button")).toBeInTheDocument();
  });

  it("does not render actions when not provided", () => {
    render(<SectionHeader title="Section Title" />);

    expect(screen.queryByText("Action Button")).not.toBeInTheDocument();
  });

  it("renders title, icon, subtitle and actions together", () => {
    const actions = (
      <>
        <button>Button 1</button>
        <button>Button 2</button>
      </>
    );

    render(
      <SectionHeader
        title="Complete Section"
        subtitle="With all props"
        icon={<Search size={20} data-testid="search-icon" />}
        actions={actions}
      />
    );

    expect(screen.getByText("Complete Section")).toBeInTheDocument();
    expect(screen.getByText("With all props")).toBeInTheDocument();
    expect(screen.getByTestId("search-icon")).toBeInTheDocument();
    expect(screen.getByText("Button 1")).toBeInTheDocument();
    expect(screen.getByText("Button 2")).toBeInTheDocument();
  });

  it("applies correct styling to title", () => {
    render(<SectionHeader title="Styled Title" />);

    const title = screen.getByText("Styled Title");
    expect(title).toHaveStyle({
      fontSize: "16px",
      fontWeight: 600,
      margin: 0,
      color: "#0f172a",
    });
  });

  it("applies correct styling to subtitle", () => {
    render(<SectionHeader title="Title" subtitle="Styled Subtitle" />);

    const subtitle = screen.getByText("Styled Subtitle");
    expect(subtitle).toHaveStyle({
      fontSize: "13px",
      color: "#64748b",
      margin: "2px 0 0",
    });
  });

  it("applies correct styling to icon", () => {
    const { container } = render(<SectionHeader title="Title" icon={<Palette size={20} data-testid="palette-icon" />} />);

    const iconSpan = container.querySelector('span[style*="font-size: 20px"]');
    expect(iconSpan).toBeInTheDocument();
    expect(screen.getByTestId("palette-icon")).toBeInTheDocument();
  });

  it("renders with only title and icon", () => {
    render(<SectionHeader title="Title" icon={<Zap size={20} data-testid="zap-icon" />} />);

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByTestId("zap-icon")).toBeInTheDocument();
    expect(screen.queryByText("Subtitle")).not.toBeInTheDocument();
  });

  it("renders with only title and subtitle", () => {
    render(<SectionHeader title="Title" subtitle="Subtitle" />);

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
  });

  it("renders with only title and actions", () => {
    const actions = <button>Action</button>;

    render(<SectionHeader title="Title" actions={actions} />);

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("applies correct layout styling to outer container", () => {
    const { container } = render(<SectionHeader title="Title" />);

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveStyle({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    });
  });

  it("renders multiple action buttons with correct gap", () => {
    const actions = (
      <>
        <button>Action 1</button>
        <button>Action 2</button>
        <button>Action 3</button>
      </>
    );

    const { container } = render(<SectionHeader title="Title" actions={actions} />);

    expect(screen.getByText("Action 1")).toBeInTheDocument();
    expect(screen.getByText("Action 2")).toBeInTheDocument();
    expect(screen.getByText("Action 3")).toBeInTheDocument();

    const actionsContainer = container.querySelector('div[style*="gap: 8px"]');
    expect(actionsContainer).toBeInTheDocument();
  });
});
