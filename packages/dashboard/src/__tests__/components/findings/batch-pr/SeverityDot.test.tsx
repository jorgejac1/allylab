// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SeverityDot } from "../../../../components/findings/batch-pr/SeverityDot";

describe("batch-pr/SeverityDot", () => {
  it("renders critical severity with red color", () => {
    const { container } = render(<SeverityDot severity="critical" />);
    const dot = container.querySelector("span");
    expect(dot).toHaveStyle({ background: "rgb(220, 38, 38)" });
  });

  it("renders serious severity with orange color", () => {
    const { container } = render(<SeverityDot severity="serious" />);
    const dot = container.querySelector("span");
    expect(dot).toHaveStyle({ background: "rgb(249, 115, 22)" });
  });

  it("renders moderate severity with yellow color", () => {
    const { container } = render(<SeverityDot severity="moderate" />);
    const dot = container.querySelector("span");
    expect(dot).toHaveStyle({ background: "rgb(234, 179, 8)" });
  });

  it("renders minor severity with blue color", () => {
    const { container } = render(<SeverityDot severity="minor" />);
    const dot = container.querySelector("span");
    expect(dot).toHaveStyle({ background: "rgb(59, 130, 246)" });
  });

  it("renders unknown severity with gray fallback color", () => {
    const { container } = render(<SeverityDot severity="unknown" />);
    const dot = container.querySelector("span");
    expect(dot).toHaveStyle({ background: "rgb(148, 163, 184)" });
  });

  it("has correct styling dimensions", () => {
    const { container } = render(<SeverityDot severity="critical" />);
    const dot = container.querySelector("span");
    expect(dot).toHaveStyle({
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      display: "inline-block",
    });
  });
});
