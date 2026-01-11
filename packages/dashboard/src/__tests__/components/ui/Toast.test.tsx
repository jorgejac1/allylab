// @vitest-environment jsdom
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

    // Advance past the duration to trigger auto-close animation
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Manually trigger animationend event since fake timers don't run CSS animations
    const toastElement = screen.getByRole("alert");
    fireEvent.animationEnd(toastElement);

    expect(onClose).toHaveBeenCalledWith("1");
  });

  it("allows manual close", () => {
    const onClose = vi.fn();
    render(<Toast toasts={[toast]} onClose={onClose} />);

    // Click the close button to trigger exit animation
    fireEvent.click(screen.getByLabelText("Close"));

    // Manually trigger animationend event since fake timers don't run CSS animations
    const toastElement = screen.getByRole("alert");
    fireEvent.animationEnd(toastElement);

    expect(onClose).toHaveBeenCalledWith("1");
  });

  it("does not close if animation ends without exit or auto-close flags", () => {
    const onClose = vi.fn();
    render(<Toast toasts={[toast]} onClose={onClose} />);

    // Manually trigger animationend event during entry animation (before either flag is set)
    const toastElement = screen.getByRole("alert");
    fireEvent.animationEnd(toastElement);

    // onClose should not be called because neither isExiting nor shouldAutoClose is true
    expect(onClose).not.toHaveBeenCalled();
  });
});
