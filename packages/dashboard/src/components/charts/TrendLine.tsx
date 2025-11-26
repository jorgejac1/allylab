import type { TrendDataPoint } from '../../types';
import { getScoreColor } from '../../utils/scoring';

interface TrendLineProps {
  data: TrendDataPoint[];
  width?: number;
  height?: number;
  showArea?: boolean;
}

export function TrendLine({ 
  data, 
  width = 600, 
  height = 200,
  showArea = true 
}: TrendLineProps) {
  if (data.length < 2) return null;

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const scores = data.map(d => d.score);
  const minScore = Math.min(...scores, 0);
  const maxScore = Math.max(...scores, 100);
  const range = maxScore - minScore || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.score - minScore) / range) * chartHeight,
    ...d,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  const trendColor = points[points.length - 1].score >= points[0].score ? '#10b981' : '#ef4444';

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = padding.top + chartHeight - ((v - minScore) / range) * chartHeight;
          if (y < padding.top || y > padding.top + chartHeight) return null;
          return (
            <g key={v}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4,4"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#9ca3af">
                {v}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {showArea && (
          <path d={areaPath} fill={`${trendColor}15`} />
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={trendColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={6}
              fill="#fff"
              stroke={getScoreColor(p.score)}
              strokeWidth={3}
            />
            <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize={11} fontWeight={600} fill="#374151">
              {p.score}
            </text>
            <text x={p.x} y={height - 10} textAnchor="middle" fontSize={11} fill="#6b7280">
              {p.date}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}