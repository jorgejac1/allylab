import { FindingDetails } from './FindingDetails';
import type { FindingDetailsDrawerProps } from './types';

export function FindingDetailsDrawer({ isOpen, ...props }: FindingDetailsDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={props.onClose}
        role="presentation"
        className="fixed inset-0 bg-black/40 z-[999]"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>

      {/* Drawer */}
      <FindingDetails {...props} />
    </>
  );
}
