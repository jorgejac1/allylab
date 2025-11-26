import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  maxWidth?: number;
}

export function PageContainer({ 
  children, 
  title, 
  subtitle, 
  actions,
  maxWidth = 1400 
}: PageContainerProps) {
  return (
    <div
      style={{
        flex: 1,
        padding: 24,
        background: '#f8fafc',
        minHeight: 'calc(100vh - 120px)',
        overflow: 'auto',
      }}
    >
      <div style={{ maxWidth, margin: '0 auto' }}>
        {/* Page Header */}
        {(title || actions) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            {title && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
                  {title}
                </h2>
                {subtitle && (
                  <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            {actions && <div style={{ display: 'flex', gap: 12 }}>{actions}</div>}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}