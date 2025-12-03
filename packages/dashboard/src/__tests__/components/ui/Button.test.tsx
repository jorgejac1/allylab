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
    expect(btn).toHaveStyle({ background: "#2563eb", fontWeight: "600" });
  });

  it("applies variant, size and disabled styles", () => {
    render(
      <Button variant="secondary" size="sm" disabled>
        Small
      </Button>
    );
    const btn = screen.getByRole("button", { name: "Small" });
    expect(btn).toBeDisabled();
    expect(btn).toHaveStyle({ cursor: "not-allowed", opacity: "0.5" });
    expect(btn).toHaveStyle({ padding: "6px 12px" });
    expect(btn).toHaveStyle({ background: "#f1f5f9" });
  });
});
