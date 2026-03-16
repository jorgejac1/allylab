import type { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function TabNav({ tabs, activeTab, onChange }: TabNavProps) {
  return (
    <nav className="flex gap-1 px-4 sm:px-6 bg-white border-b border-slate-200 overflow-x-auto">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={`flex items-center gap-2 py-3 px-3.5 sm:py-3.5 sm:px-4.5 border-0 border-b-2 whitespace-nowrap text-sm/[normal] font-medium transition-all ${
              isActive
                ? 'bg-blue-50 border-blue-600 text-blue-600'
                : 'bg-transparent border-transparent'
            } ${
              tab.disabled
                ? 'text-slate-300 cursor-not-allowed opacity-50'
                : isActive
                ? ''
                : 'text-slate-500 cursor-pointer'
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={`py-0.5 px-2 rounded-full text-[11px]/[normal] font-semibold ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
