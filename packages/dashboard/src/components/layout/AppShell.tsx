import type { ReactNode } from 'react';
import { Header } from './Header';
import { TabNav, type Tab } from './TabNav';

interface AppShellProps {
  children: ReactNode;
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  apiStatus?: 'connected' | 'disconnected' | 'checking';
}

export function AppShell({
  children,
  tabs,
  activeTab,
  onTabChange,
  apiStatus = 'connected'
}: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header apiStatus={apiStatus} />
      <TabNav tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
