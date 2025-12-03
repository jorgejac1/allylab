import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "../../../components/ui/Card";

describe("ui/Card", () => {
  it("renders children and applies padding size", () => {
    render(
      <Card padding="lg" data-testid="card">
        Content
      </Card>
    );
    const card = screen.getByTestId("card");
    expect(card).toHaveTextContent("Content");
    expect(card).toHaveStyle({ padding: "32px" });
  });
});
