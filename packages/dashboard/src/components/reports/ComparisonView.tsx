import { Card, Button } from '../ui';
import { ScoreCircle, SeverityBar } from '../charts';
import type { SavedScan } from '../../types';
import type { RegressionInfo } from '../../hooks/useScans';
import { SEVERITY_COLORS } from '../../utils/constants';
import { BarChart3, X, AlertTriangle, TrendingUp, TrendingDown, Minus, CheckCircle, PartyPopper } from 'lucide-react';
import type { ReactNode } from 'react';

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
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold m-0 flex items-center gap-2">
          <BarChart3 size={20} />Scan Comparison
        </h3>
        <Button variant="secondary" size="sm" onClick={onClose}>
          <X size={14} className="mr-1" />Close
        </Button>
      </div>

      {/* Regression Alert */}
      {hasAnyRegression && (
        <div className="flex items-center gap-3 p-3 mb-6 rounded-lg bg-amber-100 border border-amber-500">
          <span className="text-amber-500 flex items-center"><AlertTriangle size={20} /></span>
          <div className="flex-1">
            <span className="text-sm font-medium text-amber-800">
              {newerRegression
                ? `The "After" scan shows a regression of ${newerRegression.scoreDrop} points from a previous scan.`
                : `The "Before" scan shows a regression of ${olderRegression?.scoreDrop} points from an earlier scan.`
              }
            </span>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
        {/* Older Scan */}
        <ScanCard
          scan={olderScan}
          label="Before"
          regression={olderRegression}
        />

        {/* Diff Column */}
        <div className="flex flex-col gap-4 py-5 px-6 bg-slate-50 rounded-xl min-w-[140px]">
          <DiffRow
            label="Score"
            diff={formatScoreDiff(scoreDiff)}
            icon={scoreDiff > 0 ? <TrendingUp size={14} /> : scoreDiff < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
          />
          <DiffRow
            label="Issues"
            diff={formatDiff(issuesDiff)}
            icon={issuesDiff < 0 ? <CheckCircle size={14} /> : issuesDiff > 0 ? <AlertTriangle size={14} /> : <Minus size={14} />}
          />
          <hr className="border-none border-t border-slate-200 my-1" />
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
        className={`mt-6 p-4 rounded-lg ${scoreDiff >= 0 ? 'bg-green-50' : 'bg-red-50'}`}
        style={{
          border: `1px solid ${scoreDiff >= 0 ? '#bbf7d0' : '#fecaca'}`,
        }}
      >
        <div
          className={`flex items-center gap-3 text-sm font-medium ${scoreDiff >= 0 ? 'text-green-800' : 'text-red-900'}`}
        >
          <span className="flex items-center">{scoreDiff >= 0 ? <PartyPopper size={24} /> : <AlertTriangle size={24} />}</span>
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
      className={`p-5 rounded-xl ${regression ? 'bg-amber-100 border-2 border-amber-500' : 'bg-slate-50 border border-slate-200'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 font-semibold">
          {label.toUpperCase()}
        </span>
        {regression && (
          <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded bg-amber-100 border border-amber-500 text-amber-800 text-xs font-semibold">
            <TrendingDown size={12} />-{regression.scoreDrop} from previous
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 mb-4">
        <ScoreCircle score={scan.score} size={64} />
        <div>
          <div className="font-semibold">{new URL(scan.url).hostname}</div>
          <div className="text-xs text-slate-500">
            {new Date(scan.timestamp).toLocaleDateString()}
          </div>
          <div className="text-xs text-slate-500">
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
      <div className="mt-3 text-sm text-slate-500">
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
  icon?: ReactNode;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: color || '#64748b' }}>{label}</span>
      <span
        className="flex items-center gap-1 text-sm font-semibold"
        style={{ color: diff.color }}
      >
        {icon && <span className="flex items-center">{icon}</span>}
        {diff.text}
      </span>
    </div>
  );
}
