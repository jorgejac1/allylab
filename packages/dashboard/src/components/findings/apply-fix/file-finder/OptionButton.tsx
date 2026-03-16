import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface OptionButtonProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  badge?: 'recommended' | 'last-worked' | null;
  onClick: () => void;
}

export function OptionButton({
  icon,
  title,
  subtitle,
  badge,
  onClick,
}: OptionButtonProps) {
  const isHighlighted = badge === 'recommended' || badge === 'last-worked';

  return (
    <button
      onClick={onClick}
      className={`w-full py-2.5 px-3 rounded-md cursor-pointer flex items-center gap-2.5 text-sm relative ${
        isHighlighted
          ? 'border-2 border-blue-500 bg-blue-50 hover:bg-blue-100'
          : 'border border-slate-200 bg-white hover:bg-sky-50'
      }`}
    >
      <span>{icon}</span>
      <div className="text-left flex-1">
        <div className="text-[13px] font-medium">{title}</div>
        <div className="text-[11px] text-slate-500 font-mono">
          {subtitle}
        </div>
      </div>
      {badge === 'recommended' && (
        <span className="text-[10px] bg-blue-500 text-white py-0.5 px-1.5 rounded font-semibold">
          Recommended
        </span>
      )}
      {badge === 'last-worked' && (
        <span className="text-[10px] bg-green-500 text-white py-0.5 px-1.5 rounded font-semibold inline-flex items-center">
          <Check size={10} className="mr-1" aria-hidden="true" /> Last worked
        </span>
      )}
    </button>
  );
}
