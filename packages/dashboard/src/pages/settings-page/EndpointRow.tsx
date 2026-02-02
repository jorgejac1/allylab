import { Clipboard } from 'lucide-react';
import { METHOD_COLORS } from './constants';
import type { EndpointRowProps } from './types';

export function EndpointRow({
  method,
  path,
  description,
  onCopy,
}: EndpointRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        background: '#f8fafc',
        borderRadius: 6,
      }}
    >
      <span
        style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          background: `${METHOD_COLORS[method]}20`,
          color: METHOD_COLORS[method],
          fontFamily: 'monospace',
        }}
      >
        {method}
      </span>
      <code style={{ flex: 1, fontSize: 13, color: '#334155' }}>{path}</code>
      <span style={{ fontSize: 13, color: '#64748b' }}>{description}</span>
      <button
        onClick={() => onCopy(path)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
        }}
        title="Copy path"
        aria-label={`Copy ${path}`}
      >
        <Clipboard size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
