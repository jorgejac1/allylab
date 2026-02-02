import { Loader2 } from 'lucide-react';

interface TabLoaderProps {
  size?: number;
  message?: string;
}

export function TabLoader({ size = 24, message }: TabLoaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
        gap: 12,
      }}
    >
      <Loader2
        size={size}
        style={{ animation: 'spin 1s linear infinite' }}
      />
      {message && (
        <span style={{ fontSize: 14, color: '#64748b' }}>{message}</span>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
