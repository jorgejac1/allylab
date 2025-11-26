import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, padding = 'md', style, ...props }: CardProps) {
  const paddings = { none: 0, sm: 12, md: 20, lg: 32 };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: paddings[padding],
        border: '1px solid #e2e8f0',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}