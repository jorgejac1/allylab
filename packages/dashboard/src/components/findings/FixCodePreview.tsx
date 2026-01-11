import { useState } from 'react';
import type { CodeFix } from '../../types/fixes';

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
    trivial: '⚡ Trivial',
    easy: '🟢 Easy',
    medium: '🟡 Medium',
    complex: '🔴 Complex',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Confidence & Effort Badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          padding: '4px 10px',
          background: confidenceColors[fix.confidence].bg,
          color: confidenceColors[fix.confidence].color,
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 500,
        }}>
          {confidenceColors[fix.confidence].label}
        </span>
        <span style={{
          padding: '4px 10px',
          background: '#f1f5f9',
          color: '#475569',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 500,
        }}>
          {effortLabels[fix.effort]}
        </span>
      </div>

      {/* Explanation */}
      <div style={{
        padding: 12,
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 8,
        fontSize: 13,
        color: '#166534',
      }}>
        💡 {fix.explanation}
      </div>

      {/* Framework Tabs */}
      {availableFrameworks.length > 1 && (
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
          {availableFrameworks.map(fw => (
            <button
              key={fw}
              onClick={() => setActiveFramework(fw)}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: 6,
                background: activeFramework === fw ? '#3b82f6' : 'transparent',
                color: activeFramework === fw ? '#fff' : '#64748b',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {fw}
            </button>
          ))}
        </div>
      )}

      {/* View Mode Toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        {(['fixed', 'diff', 'original'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '4px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: 4,
              background: viewMode === mode ? '#f1f5f9' : '#fff',
              color: viewMode === mode ? '#1e293b' : '#64748b',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {mode === 'fixed' ? '✅ Fixed' : mode === 'diff' ? '📊 Diff' : '📄 Original'}
          </button>
        ))}
      </div>

      {/* Code Preview */}
      <div style={{ position: 'relative' }}>
        <pre style={{
          padding: 16,
          background: '#0f172a',
          color: viewMode === 'diff' ? undefined : '#e2e8f0',
          borderRadius: 8,
          fontSize: 12,
          overflow: 'auto',
          maxHeight: 300,
          margin: 0,
          fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", monospace',
          lineHeight: 1.5,
        }}>
          {viewMode === 'diff' ? (
            <DiffView diff={fix.diff} />
          ) : (
            <code>{currentCode}</code>
          )}
        </pre>
        <button
          onClick={handleCopy}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            padding: '6px 12px',
            background: '#334155',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>

      {/* WCAG References */}
      {fix.wcagCriteria.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {fix.wcagCriteria.map(tag => (
            <a
              key={tag}
              href={`https://www.w3.org/WAI/WCAG21/Understanding/${tag.toLowerCase().replace(/\./g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '2px 8px',
                background: '#eff6ff',
                color: '#2563eb',
                borderRadius: 4,
                fontSize: 11,
                textDecoration: 'none',
              }}
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
            style={{
              color,
              background: bg,
              padding: '0 4px',
              marginLeft: -4,
              marginRight: -4,
            }}
          >
            {line || ' '}
          </div>
        );
      })}
    </code>
  );
}