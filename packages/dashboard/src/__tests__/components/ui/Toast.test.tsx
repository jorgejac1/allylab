import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Toast, type ToastItem as ToastItemType } from "../../../components/ui/Toast";

describe("ui/Toast", () => {
  const toast: ToastItemType = { id: "1", type: "success", message: "Saved", duration: 200 };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("returns null when no toasts", () => {
    const { container } = render(<Toast toasts={[]} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders toast and auto closes after duration", async () => {
    const onClose = vi.fn();
    render(<Toast toasts={[toast]} onClose={onClose} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(onClose).toHaveBeenCalledWith("1");
  });

  it("allows manual close", () => {
    const onClose = vi.fn();
    render(<Toast toasts={[toast]} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close"));
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(onClose).toHaveBeenCalledWith("1");
  });
});
