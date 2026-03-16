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
    <div className="flex items-center gap-3 py-2.5 px-3 bg-slate-50 rounded-md">
      <span
        className="px-2 py-0.5 rounded text-xs font-semibold font-mono"
        style={{
          background: `${METHOD_COLORS[method]}20`,
          color: METHOD_COLORS[method],
        }}
      >
        {method}
      </span>
      <code className="flex-1 text-sm text-slate-700">{path}</code>
      <span className="text-sm text-slate-500">{description}</span>
      <button
        onClick={() => onCopy(path)}
        className="bg-transparent border-none cursor-pointer p-1 text-slate-500 flex items-center hover:text-slate-700"
        title="Copy path"
        aria-label={`Copy ${path}`}
      >
        <Clipboard size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
