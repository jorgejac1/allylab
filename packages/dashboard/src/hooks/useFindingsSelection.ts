import { useState, useCallback, useMemo } from 'react';
import type { TrackedFinding } from '../types';

export interface FindingsSelectionResult {
  selectedIds: Set<string>;
  selectedFindings: TrackedFinding[];
  isAllSelected: boolean;
  hasSelection: boolean;
  toggleSelect: (id: string) => void;
  selectAllPage: (pageFindings: TrackedFinding[]) => void;
  selectAllFiltered: (filteredFindings: TrackedFinding[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

export function useFindingsSelection(filteredFindings: TrackedFinding[]): FindingsSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllPage = useCallback((pageFindings: TrackedFinding[]) => {
    setSelectedIds((prev) => {
      const pageIds = pageFindings.map((f) => f.id);
      const allPageSelected = pageIds.every((id) => prev.has(id));
      if (allPageSelected) {
        return new Set();
      }
      return new Set(pageIds);
    });
  }, []);

  const selectAllFiltered = useCallback((filtered: TrackedFinding[]) => {
    setSelectedIds(new Set(filtered.map((f) => f.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const selectedFindings = useMemo(
    () => filteredFindings.filter((f) => selectedIds.has(f.id)),
    [filteredFindings, selectedIds]
  );

  const isAllSelected = useMemo(
    () => filteredFindings.length > 0 && filteredFindings.every((f) => selectedIds.has(f.id)),
    [filteredFindings, selectedIds]
  );

  const hasSelection = selectedIds.size > 0;

  return {
    selectedIds,
    selectedFindings,
    isAllSelected,
    hasSelection,
    toggleSelect,
    selectAllPage,
    selectAllFiltered,
    clearSelection,
    isSelected,
  };
}
