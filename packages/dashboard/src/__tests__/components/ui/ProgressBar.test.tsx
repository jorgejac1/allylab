import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressBar } from "../../../components/ui/ProgressBar";

describe("ui/ProgressBar", () => {
  it("clamps percent and shows label when enabled", () => {
    const { container } = render(<ProgressBar percent={150} showLabel />);
    expect(screen.getByText("150%")).toBeInTheDocument();
    const bar = container.querySelectorAll("div")[2] as HTMLDivElement;
    expect(bar).toHaveStyle({ width: "100%" });
  });

  it("renders with custom height and color", () => {
    const { container } = render(<ProgressBar percent={-10} color="#000" height={4} />);
    const bar = container.querySelectorAll("div")[2] as HTMLDivElement;
    expect(bar).toHaveStyle({ background: "#000" });
  });
});
