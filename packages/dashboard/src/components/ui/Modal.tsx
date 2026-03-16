import { useEffect, useRef, useCallback, useId, type ReactNode, type KeyboardEvent } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-[400px]',
  md: 'max-w-[500px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[800px]',
};

// Get all focusable elements within a container
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(elements).filter(el => !el.hasAttribute('disabled'));
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md'
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Store the element that triggered the modal and focus the modal
  useEffect(() => {
    if (isOpen) {
      // Store current active element to restore focus later
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the modal container after render
      requestAnimationFrame(() => {
        modalRef.current?.focus();
      });

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isOpen]);

  // Handle keyboard events (Escape to close, Tab for focus trap)
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    // Close on Escape
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    // Focus trap on Tab
    if (event.key === 'Tab' && modalRef.current) {
      const focusableElements = getFocusableElements(modalRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: if on first element, wrap to last
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Prevent clicks inside modal from closing it
  const handleModalClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        aria-hidden="true"
        className="fixed inset-0 bg-black/50 z-[1000] animate-[fadeIn_0.2s_ease-out]"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onClick={handleModalClick}
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] sm:w-[90%] ${sizeClasses[size]} max-h-[90vh] bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[1001] flex flex-col overflow-hidden animate-[scaleIn_0.2s_ease-out] outline-none`}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}</style>

        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-200">
          <h3 id={titleId} className="text-lg/[normal] font-semibold m-0">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="bg-none border-none text-2xl cursor-pointer text-slate-400 leading-none p-1"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 px-4 py-3 sm:px-5 sm:py-4 border-t border-slate-200 bg-slate-50">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

// Confirm Dialog variant
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? '...' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-500 m-0 leading-relaxed">
        {message}
      </p>
    </Modal>
  );
}
