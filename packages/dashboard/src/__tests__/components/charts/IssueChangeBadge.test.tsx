import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { IssueChangeBadge } from "../../../components/charts/IssueChangeBadge";

describe("charts/IssueChangeBadge", () => {
  it("renders label and change value", () => {
    render(<IssueChangeBadge label="Critical" change={-2} color="#dc2626" />);

    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("-2")).toBeInTheDocument();
  });

  it("shows green color and check icon for negative change", () => {
    const { container } = render(
      <IssueChangeBadge label="Issues" change={-5} color="#ef4444" />
    );

    const changeElement = screen.getByText("-5");
    expect(changeElement).toHaveClass("text-emerald-500");
    // Check icon should be present
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows red color with plus sign and arrow for positive change", () => {
    const { container } = render(
      <IssueChangeBadge label="Issues" change={3} color="#ef4444" />
    );

    const changeElement = screen.getByText("+3");
    expect(changeElement).toHaveClass("text-red-500");
    // ArrowUp icon should be present
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows gray color and no icon for zero change", () => {
    const { container } = render(
      <IssueChangeBadge label="Issues" change={0} color="#64748b" />
    );

    const changeElement = screen.getByText("0");
    expect(changeElement).toHaveClass("text-slate-500");
    // No icon should be present for zero change
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("displays color dot with provided color", () => {
    const { container } = render(
      <IssueChangeBadge label="Test" change={1} color="#ff5733" />
    );

    const colorDot = container.querySelector("span.rounded-full");
    expect(colorDot).toHaveStyle({ background: "#ff5733" });
  });
});
