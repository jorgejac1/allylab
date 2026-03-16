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
    <div className="flex items-center gap-3">
      <div
        className="flex-1 bg-slate-200 overflow-hidden"
        style={{ height, borderRadius: height / 2 }}
      >
        <div
          className="h-full transition-[width] duration-300 ease-in-out"
          style={{
            width: `${Math.min(100, Math.max(0, percent))}%`,
            background: color,
            borderRadius: height / 2,
          }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold text-slate-500 min-w-[50px]">
          {Math.round(percent)}%
        </span>
      )}
    </div>
  );
}
