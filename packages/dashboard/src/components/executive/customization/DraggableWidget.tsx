import type { ReactNode } from 'react';

interface DraggableWidgetProps {
  isEditing: boolean;
  label: string;
  size: 'half' | 'full';
  children: ReactNode;
}

export function DraggableWidget({
  isEditing,
  label,
  size,
  children,
}: DraggableWidgetProps) {
  if (!isEditing) {
    return <>{children}</>;
  }

  return (
    <div
      className={[
        'relative rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/30',
        size === 'full' ? 'col-span-2' : 'col-span-1',
      ].join(' ')}
    >
      {/* Label badge */}
      <span className="absolute -top-2.5 left-3 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        {label}
      </span>
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
