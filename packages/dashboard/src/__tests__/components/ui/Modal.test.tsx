import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { ConfirmModal, Modal } from "../../../components/ui/Modal";

describe("ui/Modal", () => {
  beforeEach(() => {
    // Mock requestAnimationFrame
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  describe("Basic Rendering", () => {
    it("returns null when closed", () => {
      const { container } = render(
        <Modal isOpen={false} onClose={vi.fn()} title="Modal" size="lg">
          Body
        </Modal>
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders modal content when open", () => {
      render(
        <Modal isOpen onClose={vi.fn()} title="Test Modal">
          Modal Content
        </Modal>
      );

      expect(screen.getByText("Test Modal")).toBeInTheDocument();
      expect(screen.getByText("Modal Content")).toBeInTheDocument();
    });

    it("renders footer when provided", () => {
      render(
        <Modal isOpen onClose={vi.fn()} title="Modal" footer={<button>Submit</button>}>
          Content
        </Modal>
      );

      expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
    });
  });

  describe("Accessibility Attributes", () => {
    it("has role=dialog and aria-modal=true", () => {
      render(
        <Modal isOpen onClose={vi.fn()} title="Accessible Modal">
          Content
        </Modal>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("has aria-labelledby linking to title", () => {
      render(
        <Modal isOpen onClose={vi.fn()} title="Modal Title">
          Content
        </Modal>
      );

      const dialog = screen.getByRole("dialog");
      const labelledBy = dialog.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();

      const title = document.getElementById(labelledBy!);
      expect(title).toHaveTextContent("Modal Title");
    });

    it("close button has aria-label", () => {
      render(
        <Modal isOpen onClose={vi.fn()} title="Modal">
          Content
        </Modal>
      );

      const closeButton = screen.getByRole("button", { name: "Close modal" });
      expect(closeButton).toBeInTheDocument();
    });

    it("backdrop has aria-hidden=true", () => {
      const { container } = render(
        <Modal isOpen onClose={vi.fn()} title="Modal">
          Content
        </Modal>
      );

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe("Close Behavior", () => {
    it("triggers close via close button", () => {
      const onClose = vi.fn();
      render(
        <Modal isOpen onClose={onClose} title="Modal">
          Content
        </Modal>
      );

      fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("triggers close via backdrop click", () => {
      const onClose = vi.fn();
      const { container } = render(
        <Modal isOpen onClose={onClose} title="Modal">
          Content
        </Modal>
      );

      const backdrop = container.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not close when clicking inside modal", () => {
      const onClose = vi.fn();
      render(
        <Modal isOpen onClose={onClose} title="Modal">
          <button>Inner Button</button>
        </Modal>
      );

      fireEvent.click(screen.getByRole("button", { name: "Inner Button" }));
      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on Escape key", () => {
      const onClose = vi.fn();
      render(
        <Modal isOpen onClose={onClose} title="Modal">
          Content
        </Modal>
      );

      const dialog = screen.getByRole("dialog");
      fireEvent.keyDown(dialog, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Focus Management", () => {
    it("focuses the modal when opened", async () => {
      render(
        <Modal isOpen onClose={vi.fn()} title="Modal">
          Content
        </Modal>
      );

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveFocus();
      });
    });

    it("traps focus within modal - Tab wraps to first element", async () => {
      const user = userEvent.setup();
      render(
        <Modal isOpen onClose={vi.fn()} title="Modal">
          <button>First</button>
          <button>Last</button>
        </Modal>
      );

      // Focus the last button
      const lastButton = screen.getByRole("button", { name: "Last" });
      lastButton.focus();

      // Tab should wrap to close button (first focusable)
      await user.tab();

      const closeButton = screen.getByRole("button", { name: "Close modal" });
      expect(closeButton).toHaveFocus();
    });

    it("traps focus within modal - Shift+Tab wraps to last element", async () => {
      const user = userEvent.setup();
      render(
        <Modal isOpen onClose={vi.fn()} title="Modal">
          <button>First</button>
          <button>Last</button>
        </Modal>
      );

      // Focus the close button (first focusable)
      const closeButton = screen.getByRole("button", { name: "Close modal" });
      closeButton.focus();

      // Shift+Tab should wrap to last button
      await user.tab({ shift: true });

      const lastButton = screen.getByRole("button", { name: "Last" });
      expect(lastButton).toHaveFocus();
    });

    it("restores focus to trigger element when closed", async () => {
      const triggerButton = document.createElement("button");
      triggerButton.textContent = "Trigger";
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const { rerender } = render(
        <Modal isOpen onClose={vi.fn()} title="Modal">
          Content
        </Modal>
      );

      // Close the modal
      rerender(
        <Modal isOpen={false} onClose={vi.fn()} title="Modal">
          Content
        </Modal>
      );

      await waitFor(() => {
        expect(triggerButton).toHaveFocus();
      });

      document.body.removeChild(triggerButton);
    });
  });

  describe("Body Scroll Lock", () => {
    it("prevents body scroll when modal is open", () => {
      render(
        <Modal isOpen onClose={vi.fn()} title="Modal">
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe("hidden");
    });

    it("restores body scroll when modal closes", () => {
      const { rerender } = render(
        <Modal isOpen onClose={vi.fn()} title="Modal">
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe("hidden");

      rerender(
        <Modal isOpen={false} onClose={vi.fn()} title="Modal">
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("Size Variants", () => {
    it.each(["sm", "md", "lg", "xl"] as const)("renders with size %s", (size) => {
      render(
        <Modal isOpen onClose={vi.fn()} title="Modal" size={size}>
          Content
        </Modal>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});

describe("ui/ConfirmModal", () => {
  afterEach(cleanup);

  it("renders with message and buttons", () => {
    render(
      <ConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm Action"
        message="Are you sure?"
      />
    );

    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("renders with loading state", () => {
    render(
      <ConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm"
        message="Loading..."
        isLoading
      />
    );

    expect(screen.getByRole("button", { name: "..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("calls onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={onConfirm}
        title="Confirm"
        message="Proceed?"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button clicked", () => {
    const onClose = vi.fn();
    render(
      <ConfirmModal
        isOpen
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Confirm"
        message="Proceed?"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders with custom labels", () => {
    render(
      <ConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete"
        message="Delete item?"
        confirmLabel="Delete"
        cancelLabel="Keep"
        variant="danger"
      />
    );

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep" })).toBeInTheDocument();
  });

  it("renders with primary variant", () => {
    render(
      <ConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Save"
        message="Save changes?"
        variant="primary"
      />
    );

    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });
});
