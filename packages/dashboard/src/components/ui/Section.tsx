import type { ReactNode } from 'react';

interface SectionProps {
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ title, subtitle, action, children, className }: SectionProps) {
  return (
    <div style={{ marginBottom: 20 }} className={className}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h4
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#64748b',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {title}
          </h4>
          {subtitle && (
            <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
              {subtitle}
            </span>
          )}
        </div>
        {action}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}
