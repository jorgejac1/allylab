import type { FormFieldProps } from './types';

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
