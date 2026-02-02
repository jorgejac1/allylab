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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: 24,
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e2e8f0",
      }}
    >
      {/* Score */}
      <ScoreCircle score={result.score} size={100} showGrade />

      {/* Info */}
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>
          Accessibility Report
        </h2>
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#2563eb", fontSize: 14 }}
        >
          {result.url}
        </a>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
          Scanned on {new Date(result.timestamp).toLocaleString()} · Duration:{" "}
          {(result.scanDuration / 1000).toFixed(1)}s
        </div>
      </div>

      {/* Issue Counts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        <IssueCount label="Critical" count={result.critical} color="#dc2626" />
        <IssueCount label="Serious" count={result.serious} color="#ea580c" />
        <IssueCount label="Moderate" count={result.moderate} color="#ca8a04" />
        <IssueCount label="Minor" count={result.minor} color="#65a30d" />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {onRescan && (
          <Button size="sm" onClick={onRescan} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Rescan
          </Button>
        )}
        {onExport && (
          <Button variant="secondary" size="sm" onClick={onExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{count}</div>
      <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
    </div>
  );
}
