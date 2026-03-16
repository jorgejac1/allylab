import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = { none: 'p-0', sm: 'p-2 sm:p-3', md: 'p-3 sm:p-5', lg: 'p-5 sm:p-8' };

export function Card({ children, padding = 'md', className, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl ${paddingClasses[padding]} border border-slate-200 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}
