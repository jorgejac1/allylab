import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import { Trash2, AlertTriangle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    confirmButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const iconMap: Record<typeof variant, ReactNode> = {
    danger: <Trash2 size={24} />,
    warning: <AlertTriangle size={24} />,
    info: <Info size={24} />,
  };

  const colorMap = {
    danger: { bg: 'bg-red-600/10', text: 'text-red-600' },
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
    info: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  };

  const { bg, text } = colorMap[variant];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] max-w-[400px] w-[90%] p-6 animate-[dialogFadeIn_0.15s_ease-out]">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center ${text} mb-4`}>
          {iconMap[variant]}
        </div>

        {/* Title */}
        <h2
          id="confirm-dialog-title"
          className="text-lg/[normal] font-semibold text-slate-900 m-0 mb-2"
        >
          {title}
        </h2>

        {/* Message */}
        <p
          id="confirm-dialog-message"
          className="text-sm text-slate-500 m-0 mb-6 leading-normal"
        >
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>

      <style>
        {`
          @keyframes dialogFadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}
