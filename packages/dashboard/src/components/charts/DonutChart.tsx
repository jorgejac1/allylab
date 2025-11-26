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
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      {/* Chart */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
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
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700 }}>{total}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Total</div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
          {segments.map((seg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: seg.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{seg.label}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
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