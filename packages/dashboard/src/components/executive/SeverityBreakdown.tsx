import type { Severity } from '../../types';

interface SeverityBreakdownProps {
  counts: Record<Severity, number>;
}

const SEVERITY_CONFIG: { key: Severity; label: string; color: string }[] = [
  { key: 'critical', label: 'Critical', color: '#dc2626' },
  { key: 'serious', label: 'Serious', color: '#ea580c' },
  { key: 'moderate', label: 'Moderate', color: '#ca8a04' },
  { key: 'minor', label: 'Minor', color: '#2563eb' },
];

export function SeverityBreakdown({ counts }: SeverityBreakdownProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex gap-4 flex-wrap">
      {SEVERITY_CONFIG.map(({ key, label, color }) => {
        const count = counts[key] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <div key={key} className="flex-[1_1_120px] min-w-[100px]">
            <div className="flex justify-between mb-1">
              <span className="text-sm/[normal] text-gray-500">{label}</span>
              <span className="text-sm/[normal] font-semibold" style={{ color }}>{count}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width: `${pct}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
