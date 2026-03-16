import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export function Select({ options, className, ...props }: SelectProps) {
  const isDark = className?.includes('bg-slate-9');
  return (
    <select
      className={`py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-lg text-sm/[normal] outline-none cursor-pointer min-w-0 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${isDark ? '' : 'bg-white border border-slate-200'} ${className || ''}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
