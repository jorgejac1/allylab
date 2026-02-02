import { Search } from 'lucide-react';
import { Button, Spinner } from '../../../ui';
import { FilePathRow } from './FilePathRow';
import type { FilePathListProps } from './types';

export function FilePathList({
  findings,
  allFindings,
  withPathCount,
  detectionStates,
  isAutoDetecting,
  onFilePathChange,
  onRemoveFinding,
  onDetectFile,
  onTogglePreview,
  onAutoDetectAll,
  getTextPreview,
  hasSearchCapability,
}: FilePathListProps) {
  const unmappedCount = findings.filter(f => !f.filePath.trim()).length;

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <label style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#475569',
        }}>
          File Paths ({withPathCount}/{findings.length} mapped)
        </label>

        {hasSearchCapability && unmappedCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onAutoDetectAll}
            disabled={isAutoDetecting}
          >
            {isAutoDetecting ? (
              <>
                <Spinner size={12} /> Detecting...
              </>
            ) : (
              <><Search size={12} aria-hidden="true" style={{ marginRight: 4 }} /> Auto-detect All</>
            )}
          </Button>
        )}
      </div>

      <div style={{
        maxHeight: 300,
        overflow: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
      }}>
        {findings.map((item) => {
          const originalIndex = allFindings.indexOf(item);
          const state = detectionStates[item.finding.id];

          return (
            <FilePathRow
              key={item.finding.id}
              item={item}
              detectionState={state}
              textPreview={item.fix ? getTextPreview(item.fix.original.code) : null}
              hasSearchCapability={hasSearchCapability}
              onFilePathChange={(path) => onFilePathChange(originalIndex, path)}
              onRemove={() => onRemoveFinding(originalIndex)}
              onDetect={() => onDetectFile(item, originalIndex)}
              onTogglePreview={() => onTogglePreview(item.finding.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
