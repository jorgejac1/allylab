import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', style, disabled, children, ...props }, ref) => {
    const sizes = {
      sm: { padding: '6px 12px', fontSize: 12 },
      md: { padding: '10px 20px', fontSize: 14 },
      lg: { padding: '14px 28px', fontSize: 16 },
    };

    const variants: Record<string, React.CSSProperties> = {
      primary: { background: '#2563eb', color: '#fff', border: 'none' },
      secondary: { background: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0' },
      danger: { background: '#dc2626', color: '#fff', border: 'none' },
      ghost: { background: 'transparent', color: '#64748b', border: 'none' },
    };

    return (
      <button
        ref={ref}
        style={{
          ...sizes[size],
          ...variants[variant],
          borderRadius: 8,
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s',
          ...style,
        }}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';