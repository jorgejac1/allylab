import { ProgressBar, Spinner } from '../ui';

interface ScanProgressProps {
  percent: number;
  message: string;
  isComplete: boolean;
}

export function ScanProgress({ percent, message, isComplete }: ScanProgressProps) {
  if (isComplete) return null;

  return (
    <div className="flex items-center gap-4 rounded-xl p-5 bg-blue-50 border border-blue-200">
      <Spinner size={24} />
      <div className="flex-1">
        <div className="text-sm font-semibold mb-2 text-blue-800">
          {message}
        </div>
        <ProgressBar percent={percent} color="#2563eb" height={6} />
      </div>
      <div className="text-sm font-semibold text-blue-800">
        {Math.round(percent)}%
      </div>
    </div>
  );
}