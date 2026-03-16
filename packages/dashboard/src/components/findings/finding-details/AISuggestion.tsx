import { Trophy, Medal, Award } from 'lucide-react';
import type { AISuggestionProps } from './types';

function getMedalIcon(rank: number) {
  if (rank === 1) return <Trophy size={14} aria-hidden="true" />;
  if (rank === 2) return <Medal size={14} aria-hidden="true" />;
  if (rank === 3) return <Medal size={14} aria-hidden="true" />;
  return <Award size={14} aria-hidden="true" />;
}

export function AISuggestion({ rank, type, color, text }: AISuggestionProps) {
  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg">
      <span
        className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-[11px] font-semibold mb-2.5"
        style={{
          background: `${color}15`,
          border: `1px solid ${color}30`,
          color: color,
        }}
      >
        {getMedalIcon(rank)} {rank} {type}
      </span>
      <p className="m-0 text-sm text-gray-700 leading-normal">
        {text}
      </p>
    </div>
  );
}
