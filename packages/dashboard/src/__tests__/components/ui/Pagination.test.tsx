import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Pagination } from "../../../components/ui/Pagination";

describe("ui/Pagination", () => {
  afterEach(cleanup);

  it("disables prev on first page and next on last page", () => {
    render(<Pagination currentPage={1} totalPages={1} pageSize={10} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Prev" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("changes page and page size", () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={3} pageSize={25} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Prev" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "50" } });

    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
