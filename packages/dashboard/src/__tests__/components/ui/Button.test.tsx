import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { Button } from "../../../components/ui/Button";

describe("ui/Button", () => {
  afterEach(cleanup);

  it("renders with default styles and children", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass("bg-blue-600", "text-white", "font-semibold");
  });

  it("applies variant, size and disabled styles", () => {
    render(
      <Button variant="secondary" size="sm" disabled>
        Small
      </Button>
    );
    const btn = screen.getByRole("button", { name: "Small" });
    expect(btn).toBeDisabled();
    expect(btn).toHaveClass("disabled:opacity-50", "disabled:cursor-not-allowed");
    expect(btn).toHaveClass("px-3", "py-1.5", "text-xs/[normal]");
    expect(btn).toHaveClass("bg-slate-100", "text-slate-800");
  });
});
