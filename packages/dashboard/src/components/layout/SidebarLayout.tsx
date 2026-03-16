import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
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
  footer?: ReactNode;
}

function SkipLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="absolute -top-10 left-0 bg-slate-800 text-white px-4 py-2 z-[9999] no-underline font-medium text-sm/[normal] rounded-br-lg transition-[top] duration-200 focus:top-0"
    >
      {children}
    </a>
  );
}

export function SidebarLayout({
  children,
  groups,
  activeItem,
  onItemClick,
  sidebarCollapsed = false,
  apiStatus = 'checking',
  footer,
}: SidebarLayoutProps) {
  return (
    <>
      {/* Skip Links for keyboard navigation */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#main-navigation">Skip to navigation</SkipLink>

      <div className="flex min-h-screen">
        <Sidebar
          groups={groups}
          activeItem={activeItem}
          onItemClick={onItemClick}
          collapsed={sidebarCollapsed}
          apiStatus={apiStatus}
          footer={footer}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 bg-slate-50 overflow-auto flex flex-col outline-none"
        >
          {children}
        </main>
      </div>
    </>
  );
}
