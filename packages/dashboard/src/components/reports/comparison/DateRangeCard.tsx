interface DateRangeCardProps {
  label: string;
  range: string;
  color: string;
}

export function DateRangeCard({ label, range, color }: DateRangeCardProps) {
  return (
    <div
      className="p-4 bg-white rounded-lg text-center"
      style={{
        border: `2px solid ${color}20`,
      }}
    >
      <div className="text-xs text-slate-500 mb-1 uppercase">
        {label}
      </div>
      <div className="text-sm font-semibold" style={{ color }}>{range}</div>
    </div>
  );
}
