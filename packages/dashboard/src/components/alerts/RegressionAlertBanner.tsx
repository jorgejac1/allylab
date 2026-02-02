import { AlertTriangle } from 'lucide-react';
import { Card } from '../ui';
import type { RegressionInfo } from '../../hooks/useScans';
import { formatDate } from '../../utils/scoreUtils';

interface RegressionAlertBannerProps {
  regressions: RegressionInfo[];
}

export function RegressionAlertBanner({ regressions }: RegressionAlertBannerProps) {
  return (
    <Card
      style={{
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span
          style={{ display: 'flex', alignItems: 'center', color: '#f59e0b' }}
        >
          <AlertTriangle size={24} />
        </span>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              margin: '0 0 8px',
              fontSize: 14,
              fontWeight: 600,
              color: '#92400e',
            }}
          >
            Score Regression Detected
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {regressions.slice(0, 3).map((regression) => (
              <div
                key={regression.scanId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: '#78350f',
                }}
              >
                <span style={{ fontWeight: 500 }}>{regression.url}</span>
                <span>dropped</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: '#dc2626',
                  }}
                >
                  {regression.scoreDrop} points
                </span>
                <span style={{ color: '#92400e' }}>
                  ({regression.previousScore} → {regression.currentScore})
                </span>
                <span style={{ color: '#a16207', fontSize: 12 }}>
                  • {formatDate(regression.timestamp)}
                </span>
              </div>
            ))}
            {regressions.length > 3 && (
              <div style={{ fontSize: 12, color: '#a16207' }}>
                +{regressions.length - 3} more regressions
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
