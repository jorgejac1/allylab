import type { ReactNode } from 'react';

interface SettingRowProps {
  label: string;
  description?: string;
  children: ReactNode;
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      <div>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
        {description && (
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
