export interface Tab {
  id: string;
  label: string;
  icon?: string;
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
    <nav
      style={{
        display: 'flex',
        gap: 4,
        padding: '0 24px',
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        overflowX: 'auto',
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 18px',
              background: isActive ? '#eff6ff' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isActive ? '#2563eb' : 'transparent'}`,
              cursor: tab.disabled ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 500,
              color: tab.disabled ? '#cbd5e1' : isActive ? '#2563eb' : '#64748b',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              opacity: tab.disabled ? 0.5 : 1,
            }}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: isActive ? '#2563eb' : '#e2e8f0',
                  color: isActive ? '#fff' : '#64748b',
                }}
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