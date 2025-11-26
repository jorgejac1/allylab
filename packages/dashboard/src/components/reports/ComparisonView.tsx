import { Card, Button } from '../ui';
import { ScoreCircle, SeverityBar } from '../charts';
import type { SavedScan } from '../../types';
import type { RegressionInfo } from '../../hooks/useScans';
import { SEVERITY_COLORS } from '../../utils/constants';

interface ComparisonViewProps {
  olderScan: SavedScan;
  newerScan: SavedScan;
  onClose: () => void;
  hasRegression?: (scanId: string) => RegressionInfo | undefined;
}

export function ComparisonView({ 
  olderScan, 
  newerScan, 
  onClose,
  hasRegression,
}: ComparisonViewProps) {
  const scoreDiff = newerScan.score - olderScan.score;
  const issuesDiff = newerScan.totalIssues - olderScan.totalIssues;

  const criticalDiff = newerScan.critical - olderScan.critical;
  const seriousDiff = newerScan.serious - olderScan.serious;
  const moderateDiff = newerScan.moderate - olderScan.moderate;
  const minorDiff = newerScan.minor - olderScan.minor;

  // Check if either scan has a regression
  const olderRegression = hasRegression?.(olderScan.id);
  const newerRegression = hasRegression?.(newerScan.id);
  const hasAnyRegression = olderRegression || newerRegression;

  const formatDiff = (diff: number): { text: string; color: string } => {
    if (diff > 0) return { text: `+${diff}`, color: '#ef4444' };
    if (diff < 0) return { text: `${diff}`, color: '#10b981' };
    return { text: '0', color: '#64748b' };
  };

  const formatScoreDiff = (diff: number): { text: string; color: string } => {
    if (diff > 0) return { text: `+${diff}`, color: '#10b981' };
    if (diff < 0) return { text: `${diff}`, color: '#ef4444' };
    return { text: '0', color: '#64748b' };
  };

  return (
    <Card>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          📊 Scan Comparison
        </h3>
        <Button variant="secondary" size="sm" onClick={onClose}>
          ✕ Close
        </Button>
      </div>

      {/* Regression Alert */}
      {hasAnyRegression && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            marginBottom: 24,
            borderRadius: 8,
            background: '#fef3c7',
            border: '1px solid #f59e0b',
          }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#92400e' }}>
              {newerRegression 
                ? `The "After" scan shows a regression of ${newerRegression.scoreDrop} points from a previous scan.`
                : `The "Before" scan shows a regression of ${olderRegression?.scoreDrop} points from an earlier scan.`
              }
            </span>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 24,
          alignItems: 'center',
        }}
      >
        {/* Older Scan */}
        <ScanCard 
          scan={olderScan} 
          label="Before" 
          regression={olderRegression}
        />

        {/* Diff Column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '20px 24px',
            background: '#f8fafc',
            borderRadius: 12,
            minWidth: 140,
          }}
        >
          <DiffRow
            label="Score"
            diff={formatScoreDiff(scoreDiff)}
            icon={scoreDiff > 0 ? '📈' : scoreDiff < 0 ? '📉' : '➖'}
          />
          <DiffRow
            label="Issues"
            diff={formatDiff(issuesDiff)}
            icon={issuesDiff < 0 ? '✅' : issuesDiff > 0 ? '⚠️' : '➖'}
          />
          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />
          <DiffRow
            label="Critical"
            diff={formatDiff(criticalDiff)}
            color={SEVERITY_COLORS.critical}
          />
          <DiffRow
            label="Serious"
            diff={formatDiff(seriousDiff)}
            color={SEVERITY_COLORS.serious}
          />
          <DiffRow
            label="Moderate"
            diff={formatDiff(moderateDiff)}
            color={SEVERITY_COLORS.moderate}
          />
          <DiffRow
            label="Minor"
            diff={formatDiff(minorDiff)}
            color={SEVERITY_COLORS.minor}
          />
        </div>

        {/* Newer Scan */}
        <ScanCard 
          scan={newerScan} 
          label="After" 
          regression={newerRegression}
        />
      </div>

      {/* Summary */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 8,
          background: scoreDiff >= 0 ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${scoreDiff >= 0 ? '#bbf7d0' : '#fecaca'}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 14,
            fontWeight: 500,
            color: scoreDiff >= 0 ? '#166534' : '#991b1b',
          }}
        >
          <span style={{ fontSize: 24 }}>{scoreDiff >= 0 ? '🎉' : '⚠️'}</span>
          <span>
            {scoreDiff > 0
              ? `Score improved by ${scoreDiff} points! ${issuesDiff < 0 ? `Fixed ${Math.abs(issuesDiff)} issues.` : ''}`
              : scoreDiff < 0
              ? `Score decreased by ${Math.abs(scoreDiff)} points. ${issuesDiff > 0 ? `${issuesDiff} new issues detected.` : ''}`
              : 'Score remained the same.'}
          </span>
        </div>
      </div>
    </Card>
  );
}

function ScanCard({ 
  scan, 
  label,
  regression,
}: { 
  scan: SavedScan; 
  label: string;
  regression?: RegressionInfo;
}) {
  return (
    <div
      style={{
        padding: 20,
        background: regression ? '#fef3c7' : '#f8fafc',
        borderRadius: 12,
        border: regression ? '2px solid #f59e0b' : '1px solid #e2e8f0',
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
          {label.toUpperCase()}
        </span>
        {regression && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 4,
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              color: '#92400e',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            🔻 -{regression.scoreDrop} from previous
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <ScoreCircle score={scan.score} size={64} />
        <div>
          <div style={{ fontWeight: 600 }}>{new URL(scan.url).hostname}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {new Date(scan.timestamp).toLocaleDateString()}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {new Date(scan.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
      <SeverityBar
        critical={scan.critical}
        serious={scan.serious}
        moderate={scan.moderate}
        minor={scan.minor}
        height={16}
        showLabels={false}
      />
      <div style={{ marginTop: 12, fontSize: 13, color: '#64748b' }}>
        Total: {scan.totalIssues} issues
      </div>
    </div>
  );
}

function DiffRow({
  label,
  diff,
  icon,
  color,
}: {
  label: string;
  diff: { text: string; color: string };
  icon?: string;
  color?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: color || '#64748b' }}>{label}</span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 14,
          fontWeight: 600,
          color: diff.color,
        }}
      >
        {icon && <span>{icon}</span>}
        {diff.text}
      </span>
    </div>
  );
}