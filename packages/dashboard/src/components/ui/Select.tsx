import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export function Select({ options, style, ...props }: SelectProps) {
  return (
    <select
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        fontSize: 14,
        outline: 'none',
        background: '#fff',
        cursor: 'pointer',
        ...style,
      }}
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