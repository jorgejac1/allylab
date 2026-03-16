import { Button } from "../ui";
import { ScoreCircle } from "../charts";
import type { ScanResult } from "../../types";
import { RefreshCw, Upload } from 'lucide-react';

interface ScanResultsHeaderProps {
  result: ScanResult;
  onRescan?: () => void;
  onExport?: () => void;
}

export function ScanResultsHeader({
  result,
  onRescan,
  onExport,
}: ScanResultsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white rounded-xl border border-slate-200">
      {/* Score */}
      <ScoreCircle score={result.score} size={100} showGrade />

      {/* Info */}
      <div className="flex-1">
        <h2 className="text-xl font-semibold m-0 mb-2">
          Accessibility Report
        </h2>
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 text-sm"
        >
          {result.url}
        </a>
        <div className="text-sm text-slate-500 mt-2">
          Scanned on {new Date(result.timestamp).toLocaleString()} · Duration:{" "}
          {(result.scanDuration / 1000).toFixed(1)}s
        </div>
      </div>

      {/* Issue Counts */}
      <div className="grid grid-cols-4 gap-3">
        <IssueCount label="Critical" count={result.critical} color="#dc2626" />
        <IssueCount label="Serious" count={result.serious} color="#ea580c" />
        <IssueCount label="Moderate" count={result.moderate} color="#ca8a04" />
        <IssueCount label="Minor" count={result.minor} color="#65a30d" />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {onRescan && (
          <Button size="sm" onClick={onRescan} className="inline-flex items-center gap-1.5">
            <RefreshCw size={14} /> Rescan
          </Button>
        )}
        {onExport && (
          <Button variant="secondary" size="sm" onClick={onExport} className="inline-flex items-center gap-1.5">
            <Upload size={14} /> Export
          </Button>
        )}
      </div>
    </div>
  );
}

function IssueCount({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold" style={{ color }}>{count}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
