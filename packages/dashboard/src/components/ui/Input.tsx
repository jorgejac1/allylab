import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={`py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-lg border border-slate-200 text-sm/[normal] outline-none w-full min-w-0 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${className || ''}`}
      {...props}
    />
  );
}
