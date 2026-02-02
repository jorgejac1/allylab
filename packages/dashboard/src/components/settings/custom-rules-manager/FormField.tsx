import type { FormFieldProps } from './types';

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
