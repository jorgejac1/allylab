import { useState, useEffect } from 'react';
import { getApiBase } from '../../utils/api';
import { ClipboardList } from 'lucide-react';

interface RulesStatus {
  total: number;
  enabled: number;
}

export function CustomRulesIndicator() {
  const [status, setStatus] = useState<RulesStatus | null>(null);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await fetch(`${getApiBase()}/rules`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStatus({
              total: data.data.total,
              enabled: data.data.enabled,
            });
          }
        }
      } catch {
        // Silently fail - indicator is optional
      }
    };

    fetchRules();
  }, []);

  if (!status || status.total === 0) {
    return null;
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs"
      style={{
        background: status.enabled > 0 ? '#dbeafe' : '#f1f5f9',
        border: `1px solid ${status.enabled > 0 ? '#93c5fd' : '#e2e8f0'}`,
        color: status.enabled > 0 ? '#1e40af' : '#64748b',
      }}
    >
      <ClipboardList size={14} />
      <span>
        {status.enabled} custom rule{status.enabled !== 1 ? 's' : ''} enabled
      </span>
      {status.enabled < status.total && (
        <span className="text-slate-400">
          ({status.total} total)
        </span>
      )}
    </div>
  );
}