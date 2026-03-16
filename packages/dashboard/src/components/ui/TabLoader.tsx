import { Loader2 } from 'lucide-react';

interface TabLoaderProps {
  size?: number;
  message?: string;
}

export function TabLoader({ size = 24, message }: TabLoaderProps) {
  return (
    <div className="flex flex-col justify-center items-center p-12 gap-3">
      <Loader2
        size={size}
        className="animate-spin"
      />
      {message && (
        <span className="text-sm/[normal] text-slate-500">{message}</span>
      )}
    </div>
  );
}
