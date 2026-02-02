import { MapPin } from 'lucide-react';
import type { CodeLocation } from '../utils';

interface InstanceNavigatorProps {
  autoMatch: CodeLocation | null;
  currentInstanceIndex: number;
  onGoToInstance: (index: number) => void;
}

export function InstanceNavigator({
  autoMatch,
  currentInstanceIndex,
  onGoToInstance,
}: InstanceNavigatorProps) {
  if (!autoMatch?.allInstances || autoMatch.allInstances.length <= 1) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      background: '#f8fafc',
      borderRadius: 6,
      border: '1px solid #e2e8f0',
    }}>
      <span style={{ fontSize: 12, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <MapPin size={12} aria-hidden="true" /> Instance {currentInstanceIndex + 1} of {autoMatch.allInstances.length}
      </span>
      <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
        {autoMatch.allInstances.map((instance, idx) => (
          <button
            key={idx}
            onClick={() => onGoToInstance(idx)}
            aria-label={`Go to instance ${idx + 1}${instance.isComment ? ' (comment)' : ''}`}
            aria-current={idx === currentInstanceIndex ? 'true' : undefined}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              border: idx === currentInstanceIndex ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              background: idx === currentInstanceIndex ? '#eff6ff' : instance.isComment ? '#fef3c7' : '#fff',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: idx === currentInstanceIndex ? 600 : 400,
              color: instance.isComment ? '#92400e' : '#334155',
            }}
            title={`Line ${instance.lineStart}${instance.isComment ? ' (comment)' : ''}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
