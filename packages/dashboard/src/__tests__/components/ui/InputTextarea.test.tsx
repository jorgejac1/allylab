import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";

describe("ui/Input and Textarea", () => {
  it("renders input with forwarded props", () => {
    render(<Input placeholder="type" data-testid="input" />);
    const input = screen.getByTestId("input");
    expect(input).toHaveAttribute("placeholder", "type");
    expect(input).toHaveStyle({ padding: "10px 14px" });
  });

  it("renders textarea with styles", () => {
    render(<Textarea data-testid="ta" defaultValue="hello" />);
    const ta = screen.getByTestId("ta");
    expect(ta).toHaveValue("hello");
    expect(ta).toHaveStyle({ resize: "vertical" });
  });
});
