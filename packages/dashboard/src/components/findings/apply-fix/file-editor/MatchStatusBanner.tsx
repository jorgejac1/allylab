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
    <div style={{
      padding: '10px 14px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 6,
      fontSize: 12,
      color: style.text,
    }}>
      <MatchHeader
        confidence={autoMatch.confidence}
        icon={style.icon}
        lineStart={autoMatch.lineStart}
        lineEnd={autoMatch.lineEnd}
        instanceCount={autoMatch.allInstances?.length}
        borderColor={style.border}
        textColor={style.text}
      />

      <div style={{ marginTop: 6, paddingLeft: 28, fontSize: 11, opacity: 0.9 }}>
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
    <div style={{
      padding: '10px 14px',
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: 6,
      fontSize: 12,
      color: '#dc2626',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
    }}>
      <AlertTriangle size={16} aria-hidden="true" />
      <div>
        <strong>Could not auto-detect the code location.</strong>
        <div style={{ marginTop: 4, color: '#991b1b' }}>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <strong>{messages[confidence]}</strong>
        <span style={{ marginLeft: 8, opacity: 0.8 }}>
          Lines {lineStart}-{lineEnd}
        </span>
      </div>
      {instanceCount && instanceCount > 1 && (
        <span style={{
          fontSize: 10,
          background: borderColor,
          color: textColor,
          padding: '2px 6px',
          borderRadius: 4,
          fontWeight: 600,
        }}>
          {instanceCount} instances
        </span>
      )}
    </div>
  );
}

function CommentWarning({ hasMultipleInstances }: { hasMultipleInstances?: boolean }) {
  return (
    <div style={{
      marginTop: 8,
      padding: '6px 10px',
      background: '#fef3c7',
      border: '1px solid #fcd34d',
      borderRadius: 4,
      fontSize: 11,
      color: '#92400e',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
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
  const kbdStyle = {
    background: 'rgba(255,255,255,0.5)',
    padding: '1px 4px',
    borderRadius: 2,
    border: `1px solid ${borderColor}`,
  };

  return (
    <div style={{
      marginTop: 8,
      fontSize: 10,
      color: textColor,
      opacity: 0.8,
    }}>
      <Lightbulb size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} aria-hidden="true" />
      {' '}Use <kbd style={kbdStyle}>↑</kbd> <kbd style={kbdStyle}>↓</kbd> to navigate between instances
    </div>
  );
}
