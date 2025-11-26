interface FindingsSelectionBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export function FindingsSelectionBar({
  selectedCount,
  totalFilteredCount,
  onSelectAll,
  onClearSelection,
}: FindingsSelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div style={{ 
      padding: '8px 16px', 
      background: '#eff6ff', 
      borderBottom: '1px solid #bfdbfe',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <span style={{ fontSize: 13, color: '#1e40af', fontWeight: 500 }}>
        {selectedCount} selected
      </span>
      <button
        onClick={onSelectAll}
        style={{
          background: 'none',
          border: 'none',
          color: '#2563eb',
          fontSize: 12,
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Select all {totalFilteredCount}
      </button>
      <button
        onClick={onClearSelection}
        style={{
          background: 'none',
          border: 'none',
          color: '#64748b',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Clear selection
      </button>
    </div>
  );
}