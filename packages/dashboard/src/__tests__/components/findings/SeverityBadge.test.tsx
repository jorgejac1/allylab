// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SeverityBadge } from "../../../components/findings/SeverityBadge";

describe("findings/SeverityBadge", () => {
  it("renders critical severity badge", () => {
    render(<SeverityBadge severity="critical" />);

    const badge = screen.getByText("Critical");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({
      color: "#fff",
      background: "#dc2626",
    });
  });

  it("renders serious severity badge", () => {
    render(<SeverityBadge severity="serious" />);

    const badge = screen.getByText("Serious");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({
      color: "#fff",
      background: "#ea580c",
    });
  });

  it("renders moderate severity badge", () => {
    render(<SeverityBadge severity="moderate" />);

    const badge = screen.getByText("Moderate");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({
      color: "#fff",
      background: "#ca8a04",
    });
  });

  it("renders minor severity badge", () => {
    render(<SeverityBadge severity="minor" />);

    const badge = screen.getByText("Minor");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({
      color: "#fff",
      background: "#65a30d",
    });
  });

  it("applies correct styling to all badges", () => {
    const { rerender } = render(<SeverityBadge severity="critical" />);

    const badge = screen.getByText("Critical");
    expect(badge).toHaveStyle({
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 600,
      textTransform: "capitalize",
    });

    rerender(<SeverityBadge severity="minor" />);
    const minorBadge = screen.getByText("Minor");
    expect(minorBadge).toHaveStyle({
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 600,
    });
  });
});
