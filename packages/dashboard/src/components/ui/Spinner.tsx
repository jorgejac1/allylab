interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 20, color = '#2563eb' }: SpinnerProps) {
  return (
    <div
      className="rounded-full border-2 border-slate-200 animate-spin"
      style={{
        width: size,
        height: size,
        borderTopColor: color,
      }}
    />
  );
}
