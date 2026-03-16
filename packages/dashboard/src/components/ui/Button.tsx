import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs/[normal]',
  md: 'px-5 py-2.5 text-sm/[normal]',
  lg: 'px-7 py-3.5 text-base/[normal]',
};

const variantClasses = {
  primary: 'bg-blue-600 text-white border-none',
  secondary: 'bg-slate-100 text-slate-800 border border-slate-200',
  danger: 'bg-red-600 text-white border-none',
  ghost: 'bg-transparent text-slate-500 border-none',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-lg font-semibold inline-flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
