import { RefreshCw, Lightbulb } from 'lucide-react';
import type { SelectedLines } from './types';

interface ReplacementPreviewProps {
  selectedLines: SelectedLines;
  fixedJsx: string;
}

export function ReplacementPreview({ selectedLines, fixedJsx }: ReplacementPreviewProps) {
  return (
    <div>
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        color: '#475569',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <RefreshCw size={12} style={{ marginRight: 4 }} aria-hidden="true" />
        Lines {selectedLines.start}-{selectedLines.end} will be replaced with:
      </div>
      <pre style={{
        margin: 0,
        padding: 12,
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 6,
        fontSize: 12,
        fontFamily: 'ui-monospace, monospace',
        overflow: 'auto',
        maxHeight: 100,
        whiteSpace: 'pre-wrap',
        color: '#166534',
      }}>
        {fixedJsx}
      </pre>
    </div>
  );
}

export function JSXConversionNote() {
  return (
    <div style={{
      padding: '8px 12px',
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: 6,
      fontSize: 11,
      color: '#1e40af',
    }}>
      <Lightbulb size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} aria-hidden="true" />
      <strong>Note:</strong> The fix has been converted to JSX format (class → className).
      The replacement will use: <code style={{ background: '#dbeafe', padding: '1px 4px', borderRadius: 2 }}>className</code>
    </div>
  );
}

export function PRInfoNote() {
  return (
    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, textAlign: 'center' }}>
      A new branch will be created with your changes and a PR opened for review.
    </p>
  );
}
