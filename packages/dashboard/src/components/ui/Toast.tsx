import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const colors: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  error: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  info: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
};

function ToastItem({
  id,
  type,
  message,
  duration = 4000,
  onClose
}: ToastItem & { onClose: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const [shouldAutoClose, setShouldAutoClose] = useState(false);

  useEffect(() => {
    // Trigger auto-close animation after duration
    const timer = setTimeout(() => {
      setShouldAutoClose(true);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration]);

  const handleClose = () => {
    setIsExiting(true);
  };

  const handleAnimationEnd = () => {
    if (isExiting || shouldAutoClose) {
      onClose(id);
    }
  };

  const { bg, border, text } = colors[type];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 8,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        minWidth: 300,
        maxWidth: 450,
        animation: (isExiting || shouldAutoClose) ? 'toastExit 0.2s ease-out forwards' : 'toastEnter 0.2s ease-out',
      }}
      onAnimationEnd={handleAnimationEnd}
      role="alert"
    >
      <span style={{ display: 'flex', alignItems: 'center', color: text }}>{icons[type]}</span>
      <p style={{ flex: 1, margin: 0, fontSize: 14, color: text, fontWeight: 500 }}>
        {message}
      </p>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          color: text,
          opacity: 0.6,
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function Toast({ toasts, onClose }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={onClose} />
      ))}
      <style>
        {`
          @keyframes toastEnter {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes toastExit {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(100%);
            }
          }
        `}
      </style>
    </div>
  );
}