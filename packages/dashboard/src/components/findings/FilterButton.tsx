interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

export function FilterButton({ active, onClick, label }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 4,
        border: 'none',
        background: active ? '#fff' : 'transparent',
        color: active ? '#0f172a' : '#64748b',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        boxShadow: active ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

interface PillButtonProps {
  active: boolean;
  activeColor?: string;
  onClick: () => void;
  label: string;
}

export function PillButton({ 
  active, 
  activeColor = '#2563eb', 
  onClick, 
  label 
}: PillButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: 20,
        border: active ? 'none' : '1px solid #e2e8f0',
        background: active ? activeColor : '#fff',
        color: active ? '#fff' : '#64748b',
        fontSize: 12,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {label}
    </button>
  );
}

export function Divider() {
  return <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />;
}