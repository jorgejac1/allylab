interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
}

export function Sparkline({ 
  data, 
  width = 100, 
  height = 30, 
  color = '#2563eb',
  showDots = false 
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;

  const points = data.map((value, index) => ({
    x: padding + (index / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - (value - min) / range) * (height - padding * 2),
  }));

  const pathD = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Trend color based on first vs last
  const trendColor = data[data.length - 1] >= data[0] ? '#10b981' : '#ef4444';
  const finalColor = color === 'auto' ? trendColor : color;

  return (
    <svg width={width} height={height}>
      <path
        d={pathD}
        fill="none"
        stroke={finalColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={3}
          fill={i === points.length - 1 ? finalColor : '#fff'}
          stroke={finalColor}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}