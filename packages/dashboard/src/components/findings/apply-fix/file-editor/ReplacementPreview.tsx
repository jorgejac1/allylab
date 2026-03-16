import { RefreshCw, Lightbulb } from 'lucide-react';
import type { SelectedLines } from './types';

interface ReplacementPreviewProps {
  selectedLines: SelectedLines;
  fixedJsx: string;
}

export function ReplacementPreview({ selectedLines, fixedJsx }: ReplacementPreviewProps) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-2">
        <RefreshCw size={12} className="mr-1" aria-hidden="true" />
        Lines {selectedLines.start}-{selectedLines.end} will be replaced with:
      </div>
      <pre className="m-0 p-3 bg-green-50 border border-green-200 rounded-md text-xs font-mono overflow-auto max-h-[100px] whitespace-pre-wrap text-green-800">
        {fixedJsx}
      </pre>
    </div>
  );
}

export function JSXConversionNote() {
  return (
    <div className="py-2 px-3 bg-blue-50 border border-blue-200 rounded-md text-[11px] text-blue-800">
      <Lightbulb size={12} className="inline align-middle mr-1" aria-hidden="true" />
      <strong>Note:</strong> The fix has been converted to JSX format (class → className).
      The replacement will use: <code className="bg-blue-100 px-1 py-px rounded-sm">className</code>
    </div>
  );
}

export function PRInfoNote() {
  return (
    <p className="text-[11px] text-slate-400 m-0 text-center">
      A new branch will be created with your changes and a PR opened for review.
    </p>
  );
}
