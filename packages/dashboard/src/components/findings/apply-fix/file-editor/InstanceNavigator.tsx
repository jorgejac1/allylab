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
    <div className="flex items-center gap-2 py-2 px-3 bg-slate-50 rounded-md border border-slate-200">
      <span className="text-xs text-slate-500 inline-flex items-center gap-1">
        <MapPin size={12} aria-hidden="true" /> Instance {currentInstanceIndex + 1} of {autoMatch.allInstances.length}
      </span>
      <div className="flex gap-1 ml-auto">
        {autoMatch.allInstances.map((instance, idx) => (
          <button
            key={idx}
            onClick={() => onGoToInstance(idx)}
            aria-label={`Go to instance ${idx + 1}${instance.isComment ? ' (comment)' : ''}`}
            aria-current={idx === currentInstanceIndex ? 'true' : undefined}
            className="w-6 h-6 rounded text-[11px] cursor-pointer"
            style={{
              border: idx === currentInstanceIndex ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              background: idx === currentInstanceIndex ? '#eff6ff' : instance.isComment ? '#fef3c7' : '#fff',
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
