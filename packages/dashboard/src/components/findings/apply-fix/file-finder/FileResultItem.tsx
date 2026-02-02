import { FileText, Target, Check, CircleMinus, CircleHelp } from 'lucide-react';
import type { RankedFile } from './types';
import type { MatchConfidence } from '../utils';

interface FileResultItemProps {
  file: RankedFile;
  isRanking: boolean;
  onSelect: () => void;
}

const confidenceColors: Record<MatchConfidence['level'], { bg: string; text: string; border: string }> = {
  high: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
  medium: { bg: '#fefce8', text: '#854d0e', border: '#fef08a' },
  low: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  none: { bg: '#fff', text: '#64748b', border: '#e2e8f0' },
};

export function FileResultItem({
  file,
  isRanking,
  onSelect,
}: FileResultItemProps) {
  const colors = confidenceColors[file.confidence.level];

  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: 'none',
        borderBottom: '1px solid #f1f5f9',
        borderLeft: file.isBestMatch ? '4px solid #22c55e' : '4px solid transparent',
        background: file.isBestMatch ? '#f0fdf4' : '#fff',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
      onMouseEnter={e => e.currentTarget.style.background = file.isBestMatch ? '#dcfce7' : '#f0f9ff'}
      onMouseLeave={e => e.currentTarget.style.background = file.isBestMatch ? '#f0fdf4' : '#fff'}
    >
      {/* File path + Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 12,
          fontFamily: 'monospace',
          color: '#0f172a',
          flex: 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <FileText size={12} aria-hidden="true" /> {file.path}
        </span>
        {file.isBestMatch && (
          <span style={{
            fontSize: 10,
            background: '#22c55e',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: 4,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
          }}>
            <Target size={10} style={{ marginRight: 4 }} aria-hidden="true" /> Best Match
          </span>
        )}
        {!file.isBestMatch && file.confidence.level !== 'none' && (
          <ConfidenceBadge level={file.confidence.level} colors={colors} />
        )}
      </div>

      {/* Confidence details */}
      {file.confidence.level !== 'none' && !isRanking && (
        <div style={{ fontSize: 10, color: '#64748b' }}>
          {file.confidence.details}
        </div>
      )}

      {/* Preview */}
      {file.preview && (
        <pre style={{
          margin: 0,
          padding: 8,
          background: '#f8fafc',
          borderRadius: 4,
          fontSize: 10,
          color: '#475569',
          fontFamily: 'ui-monospace, monospace',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          maxHeight: 60,
          lineHeight: 1.4,
        }}>
          {file.preview.length > 150 ? file.preview.slice(0, 150) + '...' : file.preview}
        </pre>
      )}
    </button>
  );
}

function ConfidenceBadge({
  level,
  colors,
}: {
  level: 'high' | 'medium' | 'low';
  colors: { bg: string; text: string; border: string };
}) {
  const icons = {
    high: <Check size={10} style={{ marginRight: 2 }} aria-hidden="true" />,
    medium: <CircleMinus size={10} style={{ marginRight: 2 }} aria-hidden="true" />,
    low: <CircleHelp size={10} style={{ marginRight: 2 }} aria-hidden="true" />,
  };

  const labels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <span style={{
      fontSize: 10,
      background: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      padding: '2px 6px',
      borderRadius: 4,
      fontWeight: 500,
      display: 'inline-flex',
      alignItems: 'center',
    }}>
      {icons[level]}{labels[level]}
    </span>
  );
}
