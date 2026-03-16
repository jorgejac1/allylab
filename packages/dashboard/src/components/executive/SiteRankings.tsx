import { Sparkline } from '../charts';
import { getScoreColor, getScoreGrade, formatDate } from '../../utils/scoreUtils';
import type { SiteStats } from '../../types';

interface SiteRankingsProps {
  sites: SiteStats[];
  maxItems?: number;
  onClickSite?: (url: string) => void;
}

export function SiteRankings({ sites, maxItems = 8, onClickSite }: SiteRankingsProps) {
  if (sites.length === 0) {
    return <p className="text-gray-400 text-sm">No sites scanned yet</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {sites.slice(0, maxItems).map((site, idx) => (
        <SiteRankingRow
          key={site.url}
          site={site}
          rank={idx + 1}
          isWorst={idx === 0}
          onClick={onClickSite}
        />
      ))}
      {onClickSite && (
        <p className="text-xs text-gray-400 text-center">
          Click a site to view its latest scan
        </p>
      )}
    </div>
  );
}

function SiteRankingRow({
  site,
  rank,
  isWorst,
  onClick
}: {
  site: SiteStats;
  rank: number;
  isWorst: boolean;
  onClick?: (url: string) => void;
}) {
  const isClickable = !!onClick;

  return (
    <div
      onClick={() => onClick?.(site.url)}
      className={[
        'flex items-center gap-3 py-3 px-4 rounded-lg border transition-all duration-150',
        isWorst ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200',
        isClickable ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-300' : 'cursor-default',
      ].join(' ')}
    >
      {/* Rank */}
      <RankBadge rank={rank} isWorst={isWorst} />

      {/* Site Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">
          {site.domain}
        </div>
        <div className="text-xs text-gray-400">
          {site.latestIssues} issues • Last scanned {formatDate(site.lastScanned)}
        </div>
      </div>

      {/* Trend Sparkline */}
      {site.trend.length >= 2 && (
        <Sparkline data={site.trend} width={60} height={24} color="auto" />
      )}

      {/* Score */}
      <ScoreDisplay score={site.latestScore} change={site.scoreChange} />

      {/* Grade Badge */}
      <GradeBadge score={site.latestScore} />
    </div>
  );
}

function RankBadge({ rank, isWorst }: { rank: number; isWorst: boolean }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
      style={{
        background: isWorst ? '#dc2626' : rank <= 3 ? '#f3f4f6' : '#fff',
        color: isWorst ? '#fff' : '#6b7280',
        border: rank > 3 ? '1px solid #e5e7eb' : 'none',
      }}
    >
      {rank}
    </div>
  );
}

function ScoreDisplay({ score, change }: { score: number; change: number }) {
  return (
    <div className="text-right">
      <div
        className="text-xl font-bold"
        style={{ color: getScoreColor(score) }}
      >
        {score}
      </div>
      {change !== 0 && (
        <div
          className="text-[11px] font-medium"
          style={{ color: change > 0 ? '#10b981' : '#ef4444' }}
        >
          {change > 0 ? '\u2191' : '\u2193'} {Math.abs(change)}
        </div>
      )}
    </div>
  );
}

function GradeBadge({ score }: { score: number }) {
  return (
    <div
      className="w-9 h-9 rounded-lg text-white flex items-center justify-center text-base font-bold"
      style={{ background: getScoreColor(score) }}
    >
      {getScoreGrade(score)}
    </div>
  );
}
