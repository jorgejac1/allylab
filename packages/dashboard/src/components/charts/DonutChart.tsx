import { useMemo } from 'react';

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
}

interface Segment {
  label: string;
  value: number;
  color: string;
  percent: number;
  dashArray: string;
  dashOffset: number;
}

export function DonutChart({
  data,
  size = 180,
  strokeWidth = 35,
  showLegend = true
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Use reduce to accumulate offset without reassignment
  const segments = useMemo(() => {
    const filtered = data.filter(d => d.value > 0);

    return filtered.reduce<{ segments: Segment[]; offset: number }>(
      (acc, d) => {
        const percent = d.value / total;
        const length = percent * circumference;

        const segment: Segment = {
          label: d.label,
          value: d.value,
          color: d.color,
          percent: Math.round(percent * 100),
          dashArray: `${length} ${circumference - length}`,
          dashOffset: circumference - acc.offset,
        };

        return {
          segments: [...acc.segments, segment],
          offset: acc.offset + length,
        };
      },
      { segments: [], offset: 0 }
    ).segments;
  }, [data, total, circumference]);

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      {/* Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-2 min-w-[150px]">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ background: seg.color }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{seg.label}</div>
                <div className="text-xs text-slate-500">
                  {seg.value} ({seg.percent}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
