import type { Severity } from '../../types';
import { SEVERITY_COLORS } from '../../utils/constants';

interface SeverityBarProps {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  height?: number;
  showLabels?: boolean;
}

interface Segment {
  severity: Severity;
  count: number;
  percent: number;
}

export function SeverityBar({ 
  critical, 
  serious, 
  moderate, 
  minor, 
  height = 24,
  showLabels = true 
}: SeverityBarProps) {
  const total = critical + serious + moderate + minor;
  if (total === 0) return null;

  const allSegments: Segment[] = [
    { severity: 'critical', count: critical, percent: (critical / total) * 100 },
    { severity: 'serious', count: serious, percent: (serious / total) * 100 },
    { severity: 'moderate', count: moderate, percent: (moderate / total) * 100 },
    { severity: 'minor', count: minor, percent: (minor / total) * 100 },
  ];

  const segments = allSegments.filter(s => s.count > 0);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          height,
          borderRadius: height / 2,
          overflow: 'hidden',
          background: '#e2e8f0',
        }}
      >
        {segments.map(seg => (
          <div
            key={seg.severity}
            style={{
              width: `${seg.percent}%`,
              height: '100%',
              background: SEVERITY_COLORS[seg.severity],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              minWidth: seg.percent > 10 ? 'auto' : 0,
              overflow: 'hidden',
            }}
            title={`${seg.severity}: ${seg.count}`}
          >
            {seg.percent > 15 && seg.count}
          </div>
        ))}
      </div>
      {showLabels && (
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {segments.map(seg => (
            <div key={seg.severity} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: SEVERITY_COLORS[seg.severity],
                }}
              />
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {seg.severity}: {seg.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}