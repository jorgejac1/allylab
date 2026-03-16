import type { ReactNode } from 'react';
import { Button } from './Button';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const defaultIcon = <Inbox size={64} />;

  return (
    <div className="text-center py-8 px-4 sm:py-15 sm:px-5 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
      <div className="mb-4 flex justify-center text-slate-400">{icon || defaultIcon}</div>
      <h3 className="text-lg/[normal] font-semibold m-0 mb-2 text-slate-900">
        {title}
      </h3>
      {description && (
        <p className="text-sm/[normal] text-slate-500 m-0 mb-5 max-w-[400px] mx-auto">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
