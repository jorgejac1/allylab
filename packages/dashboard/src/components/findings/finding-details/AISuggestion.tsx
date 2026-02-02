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
    <div
      style={{
        padding: 16,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: `${color}15`,
          border: `1px solid ${color}30`,
          color: color,
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        {getMedalIcon(rank)} {rank} {type}
      </span>
      <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
        {text}
      </p>
    </div>
  );
}
