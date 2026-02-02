import { memo } from 'react';
import type { FindingSource } from '../../types';
import { ClipboardList, Search } from 'lucide-react';

interface SourceBadgeProps {
  source?: FindingSource;
}

export const SourceBadge = memo(function SourceBadge({ source }: SourceBadgeProps) {
  const isCustom = source === 'custom-rule';
  
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 500,
        background: isCustom ? '#e0f2fe' : '#f1f5f9',
        color: isCustom ? '#0369a1' : '#64748b',
        border: `1px solid ${isCustom ? '#bae6fd' : '#e2e8f0'}`,
      }}
    >
      {isCustom ? <ClipboardList size={10} /> : <Search size={10} />}
      <span>{isCustom ? 'Custom' : 'axe-core'}</span>
    </span>
  );
});