import { ScoreCircle } from '../../charts';

interface PeriodCardProps {
  label: string;
  score: number;
  issues: number;
  scanCount: number;
  highlight?: boolean;
}

export function PeriodCard({
  label,
  score,
  issues,
  scanCount,
  highlight,
}: PeriodCardProps) {
  return (
    <div
      className={`p-5 rounded-xl text-center ${
        highlight
          ? 'bg-blue-50 border-2 border-blue-500'
          : 'bg-slate-50 border border-slate-200'
      }`}
    >
      <div className="text-xs text-slate-500 mb-3 font-semibold">
        {label.toUpperCase()}
      </div>
      <div className="flex justify-center mb-3">
        <ScoreCircle score={score} size={80} />
      </div>
      <div className="text-sm text-slate-500">
        Avg {issues.toFixed(1)} issues
      </div>
      <div className="text-xs text-slate-400 mt-1">
        {scanCount} scan{scanCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
