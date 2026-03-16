import type { Severity } from '../../types';
import { SEVERITY_COLORS } from '../../utils/constants';

interface SeverityBarProps {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  height?: number;
  showLabels?: boolean;
}

interface Segment {
  severity: Severity;
  count: number;
  percent: number;
}

export function SeverityBar({
  critical,
  serious,
  moderate,
  minor,
  height = 24,
  showLabels = true
}: SeverityBarProps) {
  const total = critical + serious + moderate + minor;
  if (total === 0) return null;

  const allSegments: Segment[] = [
    { severity: 'critical', count: critical, percent: (critical / total) * 100 },
    { severity: 'serious', count: serious, percent: (serious / total) * 100 },
    { severity: 'moderate', count: moderate, percent: (moderate / total) * 100 },
    { severity: 'minor', count: minor, percent: (minor / total) * 100 },
  ];

  const segments = allSegments.filter(s => s.count > 0);

  return (
    <div>
      <div
        className="flex overflow-hidden bg-slate-200"
        style={{ height, borderRadius: height / 2 }}
      >
        {segments.map(seg => (
          <div
            key={seg.severity}
            className="h-full flex items-center justify-center text-white text-xs font-semibold overflow-hidden"
            style={{
              width: `${seg.percent}%`,
              background: SEVERITY_COLORS[seg.severity],
              minWidth: seg.percent > 10 ? 'auto' : 0,
            }}
            title={`${seg.severity}: ${seg.count}`}
          >
            {seg.percent > 15 && seg.count}
          </div>
        ))}
      </div>
      {showLabels && (
        <div className="flex gap-4 mt-2 flex-wrap">
          {segments.map(seg => (
            <div key={seg.severity} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: SEVERITY_COLORS[seg.severity] }}
              />
              <span className="text-xs text-slate-500">
                {seg.severity}: {seg.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
