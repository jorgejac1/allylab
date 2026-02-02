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
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease-out',
        }}
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
