interface DateRangeCardProps {
  label: string;
  range: string;
  color: string;
}

export function DateRangeCard({ label, range, color }: DateRangeCardProps) {
  return (
    <div
      style={{
        padding: 16,
        background: '#fff',
        border: `2px solid ${color}20`,
        borderRadius: 8,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: '#64748b',
          marginBottom: 4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color }}>{range}</div>
    </div>
  );
}
