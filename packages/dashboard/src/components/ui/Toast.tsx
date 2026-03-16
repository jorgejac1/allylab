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

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-300 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
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

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border rounded-lg shadow-md w-[calc(100vw_-_2.5rem)] sm:w-auto sm:min-w-[300px] max-w-[450px] ${typeStyles[type]}`}
      style={{
        animation: (isExiting || shouldAutoClose) ? 'toastExit 0.2s ease-out forwards' : 'toastEnter 0.2s ease-out',
      }}
      onAnimationEnd={handleAnimationEnd}
      role="alert"
    >
      <span className="flex items-center">{icons[type]}</span>
      <p className="flex-1 m-0 text-sm/[normal] font-medium">
        {message}
      </p>
      <button
        onClick={handleClose}
        className="bg-none border-none cursor-pointer p-1 opacity-60 flex items-center"
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
    <div className="fixed top-5 right-5 z-[10000] flex flex-col gap-2">
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
