import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`py-2 px-3 sm:py-3 sm:px-5 border-none cursor-pointer text-sm/[normal] font-semibold flex items-center gap-2 whitespace-nowrap border-b-2 ${
              isActive
                ? 'bg-blue-50 border-b-blue-600 text-blue-600'
                : 'bg-transparent border-b-transparent text-slate-500'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`py-0.5 px-2 rounded-full text-xs/[normal] ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
