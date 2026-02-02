import type { ReactNode, CSSProperties } from 'react';
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

// Skip link styles - hidden by default, visible on focus
const skipLinkStyles: CSSProperties = {
  position: 'absolute',
  top: '-40px',
  left: 0,
  background: '#1e293b',
  color: '#fff',
  padding: '8px 16px',
  zIndex: 9999,
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: 14,
  borderRadius: '0 0 8px 0',
  transition: 'top 0.2s ease-in-out',
};

const skipLinkFocusStyles: CSSProperties = {
  ...skipLinkStyles,
  top: 0,
};

function SkipLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      style={skipLinkStyles}
      onFocus={(e) => {
        Object.assign(e.currentTarget.style, skipLinkFocusStyles);
      }}
      onBlur={(e) => {
        Object.assign(e.currentTarget.style, skipLinkStyles);
      }}
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

      <div style={{ display: 'flex', minHeight: '100vh' }}>
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
          style={{
            flex: 1,
            background: '#f8fafc',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            outline: 'none',
          }}
        >
          {children}
        </main>
      </div>
    </>
  );
}
