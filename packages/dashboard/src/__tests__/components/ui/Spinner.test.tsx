import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Spinner } from "../../../components/ui/Spinner";

describe("ui/Spinner", () => {
  it("renders with default props", () => {
    const { container } = render(<Spinner />);
    const div = container.querySelector("div") as HTMLDivElement;
    expect(div).toHaveStyle({ width: "20px", borderTopColor: "#2563eb" });
  });

  it("renders with custom size and color", () => {
    const { container } = render(<Spinner size={10} color="#000" />);
    const div = container.querySelector("div") as HTMLDivElement;
    expect(div).toHaveStyle({ width: "10px", borderTopColor: "#000" });
  });
});
