import type { ReactNode } from 'react';
import { Header } from './Header';
import { TabNav } from './TabNav';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
}

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#f8fafc',
      }}
    >
      <Header apiStatus={apiStatus} />
      <TabNav tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}