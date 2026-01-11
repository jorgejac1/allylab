import type { ReactNode } from 'react';

interface KPIGridProps {
  children: ReactNode;
  columns?: number;
  minWidth?: number;
  gap?: number;
  marginBottom?: number;
}

export function KPIGrid({ 
  children, 
  columns,
  minWidth = 200, 
  gap = 16,
  marginBottom = 24,
}: KPIGridProps) {
  const gridTemplateColumns = columns 
    ? `repeat(${columns}, 1fr)`
    : `repeat(auto-fit, minmax(${minWidth}px, 1fr))`;

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns,
      gap,
      marginBottom,
    }}>
      {children}
    </div>
  );
}