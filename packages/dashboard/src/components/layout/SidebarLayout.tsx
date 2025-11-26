import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string | number;
  disabled?: boolean;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

interface SidebarLayoutProps {
  children: ReactNode;
  groups: NavGroup[];
  activeItem: string;
  onItemClick: (id: string) => void;
  sidebarCollapsed?: boolean;
  apiStatus?: 'connected' | 'disconnected' | 'checking';
}

export function SidebarLayout({
  children,
  groups,
  activeItem,
  onItemClick,
  sidebarCollapsed = false,
  apiStatus = 'checking',
}: SidebarLayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        groups={groups}
        activeItem={activeItem}
        onItemClick={onItemClick}
        collapsed={sidebarCollapsed}
        apiStatus={apiStatus}
      />
      <main
        style={{
          flex: 1,
          background: '#f8fafc',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </main>
    </div>
  );
}