import { CanCreatePR } from '../guards/RoleGuard';

interface FindingsSelectionBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onCreatePR?: () => void;
  onExportJira?: () => void;
}

export function FindingsSelectionBar({
  selectedCount,
  totalFilteredCount,
  onSelectAll,
  onClearSelection,
  onCreatePR,
  onExportJira,
}: FindingsSelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="py-2 px-4 bg-blue-50 border-b border-blue-200 flex items-center gap-3">
      <span className="text-[13px] text-blue-800 font-medium">
        {selectedCount} selected
      </span>

      <button
        onClick={onSelectAll}
        className="bg-none border-none text-blue-600 text-xs cursor-pointer underline"
      >
        Select all {totalFilteredCount}
      </button>

      <button
        onClick={onClearSelection}
        className="bg-none border-none text-slate-500 text-xs cursor-pointer"
      >
        Clear selection
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action Buttons */}
      {onCreatePR && (
        <CanCreatePR>
          <button
            onClick={onCreatePR}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-900 text-white border-none rounded-md text-xs font-medium cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/>
            </svg>
            Create PR
          </button>
        </CanCreatePR>
      )}

      {onExportJira && (
        <button
          onClick={onExportJira}
          className="flex items-center gap-1.5 py-1.5 px-3 bg-white text-blue-800 border border-blue-200 rounded-md text-xs font-medium cursor-pointer"
        >
          Export to JIRA
        </button>
      )}
    </div>
  );
}
