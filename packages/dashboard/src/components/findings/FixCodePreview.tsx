import { useState } from 'react';
import type { CodeFix } from '../../types/fixes';
import { Zap, Circle, Lightbulb, CheckCircle, BarChart3, FileText, Clipboard, Check } from 'lucide-react';

type Framework = 'html' | 'react' | 'vue';

interface FixCodePreviewProps {
  fix: CodeFix;
  onCopy?: (code: string) => void;
}

export function FixCodePreview({ fix, onCopy }: FixCodePreviewProps) {
  const [activeFramework, setActiveFramework] = useState<Framework>('html');
  const [viewMode, setViewMode] = useState<'fixed' | 'diff' | 'original'>('fixed');
  const [copied, setCopied] = useState(false);

  const availableFrameworks = Object.entries(fix.fixes)
    .filter(([_, code]) => code)
    .map(([key]) => key as Framework);

  const currentCode = viewMode === 'original'
    ? fix.original.code
    : viewMode === 'diff'
    ? fix.diff
    : fix.fixes[activeFramework] || fix.fixes.html;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentCode);
    setCopied(true);
    onCopy?.(currentCode);
  };

  const confidenceColors = {
    high: { bg: '#dcfce7', color: '#15803d', label: 'High Confidence' },
    medium: { bg: '#fef3c7', color: '#92400e', label: 'Medium Confidence' },
    low: { bg: '#fef2f2', color: '#dc2626', label: 'Review Carefully' },
  };

  const effortLabels = {
    trivial: <><Zap size={12} className="mr-1" /> Trivial</>,
    easy: <><Circle size={12} className="mr-1 text-green-500" /> Easy</>,
    medium: <><Circle size={12} className="mr-1 text-yellow-500" /> Medium</>,
    complex: <><Circle size={12} className="mr-1 text-red-500" /> Complex</>,
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Confidence & Effort Badges */}
      <div className="flex gap-2 flex-wrap">
        <span
          className="py-1 px-2.5 rounded-md text-[11px] font-medium"
          style={{
            background: confidenceColors[fix.confidence].bg,
            color: confidenceColors[fix.confidence].color,
          }}
        >
          {confidenceColors[fix.confidence].label}
        </span>
        <span className="py-1 px-2.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium">
          {effortLabels[fix.effort]}
        </span>
      </div>

      {/* Explanation */}
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-[13px] text-green-900">
        <Lightbulb size={14} className="inline align-middle mr-1.5" />{fix.explanation}
      </div>

      {/* Framework Tabs */}
      {availableFrameworks.length > 1 && (
        <div className="flex gap-1 border-b border-slate-200 pb-2">
          {availableFrameworks.map(fw => (
            <button
              key={fw}
              onClick={() => setActiveFramework(fw)}
              className={`py-1.5 px-3 border-none rounded-md text-xs font-medium cursor-pointer uppercase ${
                activeFramework === fw
                  ? 'bg-blue-500 text-white'
                  : 'bg-transparent text-slate-500'
              }`}
            >
              {fw}
            </button>
          ))}
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex gap-1">
        {(['fixed', 'diff', 'original'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`py-1 px-2.5 border border-slate-200 rounded text-[11px] font-medium cursor-pointer ${
              viewMode === mode
                ? 'bg-slate-100 text-slate-800'
                : 'bg-white text-slate-500'
            }`}
          >
            {mode === 'fixed' ? <><CheckCircle size={10} className="mr-1" />Fixed</> : mode === 'diff' ? <><BarChart3 size={10} className="mr-1" />Diff</> : <><FileText size={10} className="mr-1" />Original</>}
          </button>
        ))}
      </div>

      {/* Code Preview */}
      <div className="relative">
        <pre
          className="p-4 bg-slate-900 rounded-lg text-xs overflow-auto max-h-[300px] m-0 leading-relaxed"
          style={{
            color: viewMode === 'diff' ? undefined : '#e2e8f0',
            fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", monospace',
          }}
        >
          {viewMode === 'diff' ? (
            <DiffView diff={fix.diff} />
          ) : (
            <code>{currentCode}</code>
          )}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 py-1.5 px-3 bg-slate-700 border-none rounded text-white text-[11px] font-medium cursor-pointer"
        >
          {copied ? <><Check size={10} className="mr-1" />Copied!</> : <><Clipboard size={10} className="mr-1" />Copy</>}
        </button>
      </div>

      {/* WCAG References */}
      {fix.wcagCriteria.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {fix.wcagCriteria.map(tag => (
            <a
              key={tag}
              href={`https://www.w3.org/WAI/WCAG21/Understanding/${tag.toLowerCase().replace(/\./g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-0.5 px-2 bg-blue-50 text-blue-600 rounded text-[11px] no-underline"
            >
              {tag} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function DiffView({ diff }: { diff: string }) {
  const lines = diff.split('\n');

  return (
    <code>
      {lines.map((line, i) => {
        let color = '#e2e8f0';
        let bg = 'transparent';

        if (line.startsWith('+')) {
          color = '#4ade80';
          bg = 'rgba(74, 222, 128, 0.1)';
        } else if (line.startsWith('-')) {
          color = '#f87171';
          bg = 'rgba(248, 113, 113, 0.1)';
        }

        return (
          <div
            key={i}
            className="px-1 -mx-1"
            style={{
              color,
              background: bg,
            }}
          >
            {line || ' '}
          </div>
        );
      })}
    </code>
  );
}
