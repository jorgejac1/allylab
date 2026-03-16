import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  maxWidth?: number;
}

export function PageContainer({
  children,
  title,
  subtitle,
  actions,
  maxWidth = 1400
}: PageContainerProps) {
  return (
    <div className="flex-1 p-4 sm:p-6 bg-slate-50 min-h-[calc(100vh_-_120px)] overflow-auto">
      <div className="mx-auto" style={{ maxWidth }}>
        {/* Page Header */}
        {(title || actions) && (
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-between sm:items-start mb-6">
            {title && (
              <div>
                <h2 className="text-xl/[normal] sm:text-2xl/[normal] font-bold m-0 mb-1 text-slate-900">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm/[normal] text-slate-500 m-0">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            {actions && <div className="flex gap-3">{actions}</div>}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
