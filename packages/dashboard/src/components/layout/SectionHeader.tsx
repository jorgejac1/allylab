import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function SectionHeader({ title, subtitle, icon, actions }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#0f172a' }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}