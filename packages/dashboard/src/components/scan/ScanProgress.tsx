import { ProgressBar, Spinner } from '../ui';

interface ScanProgressProps {
  percent: number;
  message: string;
  isComplete: boolean;
}

export function ScanProgress({ percent, message, isComplete }: ScanProgressProps) {
  if (isComplete) return null;

  return (
    <div
      style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <Spinner size={24} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>
          {message}
        </div>
        <ProgressBar percent={percent} color="#2563eb" height={6} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1e40af' }}>
        {Math.round(percent)}%
      </div>
    </div>
  );
}