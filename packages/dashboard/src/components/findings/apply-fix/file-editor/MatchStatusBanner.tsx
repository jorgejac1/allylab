import { AlertTriangle, CheckCircle, AlertOctagon, Lightbulb } from 'lucide-react';
import type { CodeLocation } from '../utils';

interface MatchStatusBannerProps {
  autoMatch: CodeLocation | null;
}

const styles = {
  high: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: <CheckCircle size={16} aria-hidden="true" /> },
  medium: { bg: '#fefce8', border: '#fef08a', text: '#854d0e', icon: <AlertOctagon size={16} aria-hidden="true" /> },
  low: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', icon: <AlertTriangle size={16} aria-hidden="true" /> },
};

export function MatchStatusBanner({ autoMatch }: MatchStatusBannerProps) {
  if (!autoMatch) {
    return <NoMatchBanner />;
  }

  const style = styles[autoMatch.confidence];
  const hasMultipleInstances = autoMatch.allInstances && autoMatch.allInstances.length > 1;

  return (
    <div
      className="py-2.5 px-3.5 rounded-md text-xs"
      style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}
    >
      <MatchHeader
        confidence={autoMatch.confidence}
        icon={style.icon}
        lineStart={autoMatch.lineStart}
        lineEnd={autoMatch.lineEnd}
        instanceCount={autoMatch.allInstances?.length}
        borderColor={style.border}
        textColor={style.text}
      />

      <div className="mt-1.5 pl-7 text-[11px] opacity-90">
        {autoMatch.reason}
      </div>

      {autoMatch.isComment && (
        <CommentWarning hasMultipleInstances={hasMultipleInstances} />
      )}

      {hasMultipleInstances && !autoMatch.isComment && (
        <NavigationHint borderColor={style.border} textColor={style.text} />
      )}
    </div>
  );
}

function NoMatchBanner() {
  return (
    <div className="py-2.5 px-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 flex items-start gap-2">
      <AlertTriangle size={16} aria-hidden="true" />
      <div>
        <strong>Could not auto-detect the code location.</strong>
        <div className="mt-1 text-red-800">
          Please enable "Manual selection mode" and select the lines to replace.
        </div>
      </div>
    </div>
  );
}

function MatchHeader({
  confidence,
  icon,
  lineStart,
  lineEnd,
  instanceCount,
  borderColor,
  textColor,
}: {
  confidence: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  lineStart: number;
  lineEnd: number;
  instanceCount?: number;
  borderColor: string;
  textColor: string;
}) {
  const messages = {
    high: 'Match found!',
    medium: 'Likely match found - please verify',
    low: 'Possible match - please verify carefully',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center">{icon}</span>
      <div className="flex-1">
        <strong>{messages[confidence]}</strong>
        <span className="ml-2 opacity-80">
          Lines {lineStart}-{lineEnd}
        </span>
      </div>
      {instanceCount && instanceCount > 1 && (
        <span
          className="text-[10px] py-0.5 px-1.5 rounded font-semibold"
          style={{ background: borderColor, color: textColor }}
        >
          {instanceCount} instances
        </span>
      )}
    </div>
  );
}

function CommentWarning({ hasMultipleInstances }: { hasMultipleInstances?: boolean }) {
  return (
    <div className="mt-2 py-1.5 px-2.5 bg-amber-100 border border-amber-300 rounded text-[11px] text-amber-800 flex items-center gap-1.5">
      <AlertTriangle size={12} aria-hidden="true" />
      <span>
        <strong>Warning:</strong> This appears to be in a comment or type definition, not actual code.
        {hasMultipleInstances && ' Try navigating to another instance.'}
      </span>
    </div>
  );
}

function NavigationHint({
  borderColor,
  textColor,
}: {
  borderColor: string;
  textColor: string;
}) {
  return (
    <div className="mt-2 text-[10px] opacity-80" style={{ color: textColor }}>
      <Lightbulb size={10} className="inline align-middle mr-1" aria-hidden="true" />
      {' '}Use <kbd className="px-1 py-px rounded-sm" style={{ background: 'rgba(255,255,255,0.5)', border: `1px solid ${borderColor}` }}>↑</kbd> <kbd className="px-1 py-px rounded-sm" style={{ background: 'rgba(255,255,255,0.5)', border: `1px solid ${borderColor}` }}>↓</kbd> to navigate between instances
    </div>
  );
}
