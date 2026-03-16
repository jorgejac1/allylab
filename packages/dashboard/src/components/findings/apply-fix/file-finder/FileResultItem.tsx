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
      className={`w-full py-2.5 px-3 border-none border-b border-slate-100 text-left cursor-pointer flex flex-col gap-1 ${
        file.isBestMatch
          ? 'border-l-4 border-l-green-500 bg-green-50 hover:bg-green-100'
          : 'border-l-4 border-l-transparent bg-white hover:bg-sky-50'
      }`}
    >
      {/* File path + Badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-900 flex-1 inline-flex items-center gap-1">
          <FileText size={12} aria-hidden="true" /> {file.path}
        </span>
        {file.isBestMatch && (
          <span className="text-[10px] bg-green-500 text-white py-0.5 px-1.5 rounded font-semibold inline-flex items-center">
            <Target size={10} className="mr-1" aria-hidden="true" /> Best Match
          </span>
        )}
        {!file.isBestMatch && file.confidence.level !== 'none' && (
          <ConfidenceBadge level={file.confidence.level} colors={colors} />
        )}
      </div>

      {/* Confidence details */}
      {file.confidence.level !== 'none' && !isRanking && (
        <div className="text-[10px] text-slate-500">
          {file.confidence.details}
        </div>
      )}

      {/* Preview */}
      {file.preview && (
        <pre className="m-0 p-2 bg-slate-50 rounded text-[10px] text-slate-600 font-mono whitespace-pre-wrap overflow-hidden max-h-[60px] leading-snug">
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
    high: <Check size={10} className="mr-0.5" aria-hidden="true" />,
    medium: <CircleMinus size={10} className="mr-0.5" aria-hidden="true" />,
    low: <CircleHelp size={10} className="mr-0.5" aria-hidden="true" />,
  };

  const labels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <span
      className="text-[10px] py-0.5 px-1.5 rounded font-medium inline-flex items-center"
      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
    >
      {icons[level]}{labels[level]}
    </span>
  );
}
