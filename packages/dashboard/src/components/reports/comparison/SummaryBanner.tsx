import { PartyPopper, AlertTriangle, Minus } from 'lucide-react';

interface ComparisonScore {
  change: number;
  changePercent: number;
}

interface SummaryBannerProps {
  comparison: {
    score: ComparisonScore;
  };
}

export function SummaryBanner({ comparison }: SummaryBannerProps) {
  const improved = comparison.score.change > 0;
  const declined = comparison.score.change < 0;

  return (
    <div
      className={`p-4 rounded-lg ${
        improved
          ? 'bg-green-50 border border-green-200'
          : declined
            ? 'bg-red-50 border border-red-200'
            : 'bg-slate-50 border border-slate-200'
      }`}
    >
      <div
        className={`flex items-center gap-3 text-sm font-medium ${
          improved
            ? 'text-green-800'
            : declined
              ? 'text-red-900'
              : 'text-slate-500'
        }`}
      >
        <span>
          {improved ? (
            <PartyPopper size={24} />
          ) : declined ? (
            <AlertTriangle size={24} />
          ) : (
            <Minus size={24} />
          )}
        </span>
        <span>
          {improved
            ? `Great progress! Score improved by ${
                comparison.score.change
              } points (${comparison.score.changePercent.toFixed(
                1
              )}%) compared to the previous period.`
            : declined
              ? `Score decreased by ${Math.abs(
                  comparison.score.change
                )} points (${Math.abs(comparison.score.changePercent).toFixed(
                  1
                )}%) compared to the previous period.`
              : 'Score remained stable between the two periods.'}
        </span>
      </div>
    </div>
  );
}
