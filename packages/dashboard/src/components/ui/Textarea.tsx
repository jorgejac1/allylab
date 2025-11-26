import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ style, ...props }: TextareaProps) {
  return (
    <textarea
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        fontSize: 14,
        outline: 'none',
        width: '100%',
        resize: 'vertical',
        fontFamily: 'inherit',
        minHeight: 100,
        ...style,
      }}
      {...props}
    />
  );
}