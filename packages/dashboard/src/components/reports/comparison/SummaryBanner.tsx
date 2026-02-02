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
      style={{
        padding: 16,
        borderRadius: 8,
        background: improved ? '#f0fdf4' : declined ? '#fef2f2' : '#f8fafc',
        border: `1px solid ${
          improved ? '#bbf7d0' : declined ? '#fecaca' : '#e2e8f0'
        }`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 14,
          fontWeight: 500,
          color: improved ? '#166534' : declined ? '#991b1b' : '#64748b',
        }}
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
