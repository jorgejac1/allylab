interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '12px 20px',
            background: activeTab === tab.id ? '#eff6ff' : 'transparent',
            border: 'none',
            borderBottom: `2px solid ${activeTab === tab.id ? '#2563eb' : 'transparent'}`,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === tab.id ? '#2563eb' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              style={{
                background: activeTab === tab.id ? '#2563eb' : '#e2e8f0',
                color: activeTab === tab.id ? '#fff' : '#64748b',
                padding: '2px 8px',
                borderRadius: 20,
                fontSize: 12,
              }}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}