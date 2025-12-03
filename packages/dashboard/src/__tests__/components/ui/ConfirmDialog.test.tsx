import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

describe("ui/ConfirmDialog", () => {
  const defaultProps = {
    isOpen: true,
    message: "Proceed?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  afterEach(cleanup);

  it("returns null when closed", () => {
    const { container } = render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders and handles confirm and cancel actions", () => {
    render(<ConfirmDialog {...defaultProps} title="Title" confirmLabel="Yes" cancelLabel="No" variant="danger" />);

    fireEvent.click(screen.getByText("Yes"));
    fireEvent.click(screen.getByText("No"));

    expect(defaultProps.onConfirm).toHaveBeenCalled();
    expect(defaultProps.onCancel).toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls cancel on backdrop click and Escape key", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("handles Escape key when dialog opens", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("does not trigger cancel for other keys", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onCancel).not.toHaveBeenCalled();
  });
});
