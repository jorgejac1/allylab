import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ style, ...props }: InputProps) {
  return (
    <input
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        fontSize: 14,
        outline: 'none',
        width: '100%',
        ...style,
      }}
      {...props}
    />
  );
}