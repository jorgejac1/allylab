import type { Severity } from '../../types';

interface SeverityBreakdownProps {
  counts: Record<Severity, number>;
}

const SEVERITY_CONFIG: { key: Severity; label: string; color: string }[] = [
  { key: 'critical', label: 'Critical', color: '#dc2626' },
  { key: 'serious', label: 'Serious', color: '#ea580c' },
  { key: 'moderate', label: 'Moderate', color: '#ca8a04' },
  { key: 'minor', label: 'Minor', color: '#2563eb' },
];

export function SeverityBreakdown({ counts }: SeverityBreakdownProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {SEVERITY_CONFIG.map(({ key, label, color }) => {
        const count = counts[key] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        
        return (
          <div key={key} style={{ flex: '1 1 120px', minWidth: 100 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: 4 
            }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color }}>{count}</span>
            </div>
            <div style={{ 
              height: 6, 
              background: '#f3f4f6', 
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: color,
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}