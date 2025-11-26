interface ProgressBarProps {
  percent: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({ 
  percent, 
  color = '#2563eb', 
  height = 8,
  showLabel = false 
}: ProgressBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          flex: 1,
          height,
          background: '#e2e8f0',
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, percent))}%`,
            height: '100%',
            background: color,
            borderRadius: height / 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      {showLabel && (
        <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b', minWidth: 50 }}>
          {Math.round(percent)}%
        </span>
      )}
    </div>
  );
}