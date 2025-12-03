import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SeverityBadge, StatusBadge } from "../../../components/ui/Badge";

describe("ui/Badge", () => {
  it("renders severity badge with label and count", () => {
    render(<SeverityBadge severity="critical" count={2} />);
    expect(screen.getByText(/Critical/i)).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
  });

  it("renders status badge with icon and text", () => {
    render(<StatusBadge status="recurring" />);
    expect(screen.getByText(/Recurring/i)).toBeInTheDocument();
  });
});
