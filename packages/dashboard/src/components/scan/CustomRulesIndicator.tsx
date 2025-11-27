import { useState, useEffect } from 'react';
import { getApiBase } from '../../utils/api';

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
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 6,
        background: status.enabled > 0 ? '#dbeafe' : '#f1f5f9',
        border: `1px solid ${status.enabled > 0 ? '#93c5fd' : '#e2e8f0'}`,
        fontSize: 12,
        color: status.enabled > 0 ? '#1e40af' : '#64748b',
      }}
    >
      <span>📋</span>
      <span>
        {status.enabled} custom rule{status.enabled !== 1 ? 's' : ''} enabled
      </span>
      {status.enabled < status.total && (
        <span style={{ color: '#94a3b8' }}>
          ({status.total} total)
        </span>
      )}
    </div>
  );
}