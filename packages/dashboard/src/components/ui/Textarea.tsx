import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={`py-2.5 px-3.5 rounded-lg border border-slate-200 text-sm/[normal] outline-none w-full resize-y font-[inherit] min-h-[100px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${className || ''}`}
      {...props}
    />
  );
}
