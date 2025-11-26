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
    return <p style={{ color: '#9ca3af', fontSize: 14 }}>No sites scanned yet</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
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
  const baseBackground = isWorst ? '#fef2f2' : '#fff';
  const baseBorder = isWorst ? '#fecaca' : '#e5e7eb';

  return (
    <div 
      onClick={() => onClick?.(site.url)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: baseBackground,
        border: `1px solid ${baseBorder}`,
        borderRadius: 8,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.background = '#f0f9ff';
          e.currentTarget.style.borderColor = '#93c5fd';
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          e.currentTarget.style.background = baseBackground;
          e.currentTarget.style.borderColor = baseBorder;
        }
      }}
    >
      {/* Rank */}
      <RankBadge rank={rank} isWorst={isWorst} />

      {/* Site Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          fontWeight: 500, 
          color: '#111827',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {site.domain}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
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
    <div style={{
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: isWorst ? '#dc2626' : rank <= 3 ? '#f3f4f6' : '#fff',
      color: isWorst ? '#fff' : '#6b7280',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 600,
      border: rank > 3 ? '1px solid #e5e7eb' : 'none',
    }}>
      {rank}
    </div>
  );
}

function ScoreDisplay({ score, change }: { score: number; change: number }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{
        fontSize: 20,
        fontWeight: 700,
        color: getScoreColor(score),
      }}>
        {score}
      </div>
      {change !== 0 && (
        <div style={{
          fontSize: 11,
          color: change > 0 ? '#10b981' : '#ef4444',
          fontWeight: 500,
        }}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}
        </div>
      )}
    </div>
  );
}

function GradeBadge({ score }: { score: number }) {
  return (
    <div style={{
      width: 36,
      height: 36,
      borderRadius: 8,
      background: getScoreColor(score),
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 16,
      fontWeight: 700,
    }}>
      {getScoreGrade(score)}
    </div>
  );
}