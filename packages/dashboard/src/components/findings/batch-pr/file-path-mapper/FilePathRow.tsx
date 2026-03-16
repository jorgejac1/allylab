import { Search, CheckCircle, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Spinner } from '../../../ui';
import { SeverityDot } from '../SeverityDot';
import { ConfidenceBadge } from './ConfidenceBadge';
import { FixPreview } from './FixPreview';
import type { FilePathRowProps } from './types';

export function FilePathRow({
  item,
  detectionState,
  textPreview,
  hasSearchCapability,
  onFilePathChange,
  onRemove,
  onDetect,
  onTogglePreview,
}: FilePathRowProps) {
  const isDetecting = detectionState?.isDetecting;
  const result = detectionState?.result;
  const showPreview = detectionState?.showPreview;
  const hasMappedPath = item.filePath.trim().length > 0;

  return (
    <div className="border-b border-slate-200">
      {/* Main Row */}
      <div className="py-2.5 px-3 flex items-start gap-2.5">
        {/* Status indicator */}
        <div className="pt-0.5 flex items-center">
          {hasMappedPath ? (
            <CheckCircle size={14} className="text-green-600" aria-hidden="true" />
          ) : (
            <SeverityDot severity={item.finding.impact} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              {item.finding.ruleTitle}
            </span>

            {/* Text preview badge */}
            {textPreview && (
              <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-px rounded whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                "{textPreview}"
              </span>
            )}

            {/* Confidence badge */}
            {result && hasMappedPath && (
              <ConfidenceBadge confidence={result.confidence} />
            )}
          </div>

          {/* File path input */}
          <div className="flex gap-1.5 items-center">
            <input
              type="text"
              placeholder="src/components/Example.tsx"
              value={item.filePath}
              onChange={e => onFilePathChange(e.target.value)}
              aria-label={`File path for ${item.finding.ruleTitle}`}
              className="flex-1 py-1.5 px-2 border border-slate-200 rounded text-xs font-mono"
            />

            {/* Search/Detect button */}
            {hasSearchCapability && !hasMappedPath && (
              <button
                onClick={onDetect}
                disabled={isDetecting}
                className={`py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 whitespace-nowrap ${isDetecting ? 'cursor-wait' : 'cursor-pointer'}`}
              >
                {isDetecting ? <Spinner size={12} /> : <><Search size={12} aria-hidden="true" className="mr-1" />Search</>}
              </button>
            )}
          </div>

          {/* Detection result hint */}
          {result && !hasMappedPath && result.reason && (
            <div className="text-[11px] text-slate-400 mt-1">
              {result.reason}
            </div>
          )}

          {/* Preview toggle */}
          {item.fix && (
            <button
              onClick={onTogglePreview}
              className="mt-1.5 bg-none border-none text-blue-500 text-[11px] cursor-pointer p-0 flex items-center gap-1"
            >
              {showPreview ? (
                <ChevronDown size={12} aria-hidden="true" className="mr-1" />
              ) : (
                <ChevronRight size={12} aria-hidden="true" className="mr-1" />
              )}
              Preview fix
            </button>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          aria-label={`Remove ${item.finding.ruleTitle} from PR`}
          className="bg-none border-none text-slate-400 cursor-pointer p-1"
          title="Remove from PR"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Expanded Preview */}
      {showPreview && item.fix && (
        <FixPreview
          originalCode={item.fix.original.code}
          fixedCode={item.fix.fixes.html}
        />
      )}
    </div>
  );
}
