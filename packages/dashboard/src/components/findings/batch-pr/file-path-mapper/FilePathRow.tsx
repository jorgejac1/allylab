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
    <div style={{ borderBottom: '1px solid #e2e8f0' }}>
      {/* Main Row */}
      <div
        style={{
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        {/* Status indicator */}
        <div style={{ paddingTop: 2, display: 'flex', alignItems: 'center' }}>
          {hasMappedPath ? (
            <CheckCircle size={14} style={{ color: '#16a34a' }} aria-hidden="true" />
          ) : (
            <SeverityDot severity={item.finding.impact} />
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}>
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {item.finding.ruleTitle}
            </span>

            {/* Text preview badge */}
            {textPreview && (
              <span style={{
                fontSize: 11,
                color: '#64748b',
                background: '#f1f5f9',
                padding: '1px 6px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 120,
              }}>
                "{textPreview}"
              </span>
            )}

            {/* Confidence badge */}
            {result && hasMappedPath && (
              <ConfidenceBadge confidence={result.confidence} />
            )}
          </div>

          {/* File path input */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="src/components/Example.tsx"
              value={item.filePath}
              onChange={e => onFilePathChange(e.target.value)}
              aria-label={`File path for ${item.finding.ruleTitle}`}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'ui-monospace, monospace',
              }}
            />

            {/* Search/Detect button */}
            {hasSearchCapability && !hasMappedPath && (
              <button
                onClick={onDetect}
                disabled={isDetecting}
                style={{
                  padding: '6px 10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: isDetecting ? 'wait' : 'pointer',
                  color: '#475569',
                  whiteSpace: 'nowrap',
                }}
              >
                {isDetecting ? <Spinner size={12} /> : <><Search size={12} aria-hidden="true" style={{ marginRight: 4 }} />Search</>}
              </button>
            )}
          </div>

          {/* Detection result hint */}
          {result && !hasMappedPath && result.reason && (
            <div style={{
              fontSize: 11,
              color: '#94a3b8',
              marginTop: 4,
            }}>
              {result.reason}
            </div>
          )}

          {/* Preview toggle */}
          {item.fix && (
            <button
              onClick={onTogglePreview}
              style={{
                marginTop: 6,
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: 11,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {showPreview ? (
                <ChevronDown size={12} aria-hidden="true" style={{ marginRight: 4 }} />
              ) : (
                <ChevronRight size={12} aria-hidden="true" style={{ marginRight: 4 }} />
              )}
              Preview fix
            </button>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          aria-label={`Remove ${item.finding.ruleTitle} from PR`}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 4,
          }}
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
