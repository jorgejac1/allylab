import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Select } from "../../../components/ui/Select";

describe("ui/Select", () => {
  const options = [
    { value: "one", label: "One" },
    { value: "two", label: "Two" },
  ];

  it("renders options and forwards change", () => {
    const onChange = vi.fn();
    render(<Select options={options} value="one" onChange={onChange} aria-label="select" />);
    expect(screen.getByDisplayValue("One")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("select"), { target: { value: "two" } });
    expect(onChange).toHaveBeenCalled();
  });
});
