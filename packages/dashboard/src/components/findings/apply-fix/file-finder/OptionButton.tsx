import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface OptionButtonProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  badge?: 'recommended' | 'last-worked' | null;
  onClick: () => void;
}

export function OptionButton({
  icon,
  title,
  subtitle,
  badge,
  onClick,
}: OptionButtonProps) {
  const isHighlighted = badge === 'recommended' || badge === 'last-worked';

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: isHighlighted ? '2px solid #3b82f6' : '1px solid #e2e8f0',
        borderRadius: 6,
        background: isHighlighted ? '#eff6ff' : '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 14,
        position: 'relative',
      }}
      onMouseEnter={e => e.currentTarget.style.background = isHighlighted ? '#dbeafe' : '#f0f9ff'}
      onMouseLeave={e => e.currentTarget.style.background = isHighlighted ? '#eff6ff' : '#fff'}
    >
      <span>{icon}</span>
      <div style={{ textAlign: 'left', flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
          {subtitle}
        </div>
      </div>
      {badge === 'recommended' && (
        <span style={{
          fontSize: 10,
          background: '#3b82f6',
          color: '#fff',
          padding: '2px 6px',
          borderRadius: 4,
          fontWeight: 600,
        }}>
          Recommended
        </span>
      )}
      {badge === 'last-worked' && (
        <span style={{
          fontSize: 10,
          background: '#22c55e',
          color: '#fff',
          padding: '2px 6px',
          borderRadius: 4,
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
        }}>
          <Check size={10} style={{ marginRight: 4 }} aria-hidden="true" /> Last worked
        </span>
      )}
    </button>
  );
}
