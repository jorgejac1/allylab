import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ConfirmModal, Modal } from "../../../components/ui/Modal";

describe("ui/Modal", () => {
  afterEach(cleanup);

  it("returns null when closed", () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Modal" size="lg">
        Body
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders and triggers close via backdrop and close button", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Modal title" size="sm">
        Content
      </Modal>
    );

    fireEvent.click(screen.getByText("×"));
    fireEvent.click(screen.getAllByRole("button")[0]); // backdrop is first rendered element
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders confirm modal with loading state", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Confirm"
        message="Are you sure?"
        isLoading
        variant="danger"
      />
    );

    const confirmButton = screen.getByRole("button", { name: "..." });
    expect(confirmButton).toBeDisabled();
    expect(screen.getByText("Cancel")).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders confirm modal with primary variant and custom label", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={onConfirm}
        title="Confirm"
        message="Save changes?"
        confirmLabel="Save"
        variant="primary"
        isLoading={false}
      />
    );

    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);
    expect(onConfirm).toHaveBeenCalled();
  });
});
