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
      <div className="flex justify-between items-center mb-2">
        <label className="text-[13px] font-medium text-slate-600">
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
              <><Search size={12} aria-hidden="true" className="mr-1" /> Auto-detect All</>
            )}
          </Button>
        )}
      </div>

      <div className="max-h-[300px] overflow-auto border border-slate-200 rounded-lg">
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
