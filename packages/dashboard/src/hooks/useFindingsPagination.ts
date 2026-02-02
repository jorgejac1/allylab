import { useState, useMemo, useCallback } from 'react';
import type { TrackedFinding } from '../types';

export interface FindingsPaginationResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  paginatedFindings: TrackedFinding[];
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
}

export function useFindingsPagination(
  filteredFindings: TrackedFinding[],
  initialPageSize = 10
): FindingsPaginationResult {
  const [rawPage, setRawPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = Math.ceil(filteredFindings.length / pageSize);

  // Derive the effective page - clamp to valid bounds during render
  const currentPage = useMemo(() => {
    if (totalPages === 0) return 1;
    if (rawPage > totalPages) return totalPages;
    if (rawPage < 1) return 1;
    return rawPage;
  }, [rawPage, totalPages]);

  const paginatedFindings = useMemo(
    () => filteredFindings.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredFindings, currentPage, pageSize]
  );

  // Wrapper for setCurrentPage that updates rawPage
  const setCurrentPage = useCallback((page: number) => {
    setRawPage(page);
  }, []);

  // Reset to page 1 when page size changes
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setRawPage(1);
  }, []);

  // Navigation helpers
  const goToFirstPage = useCallback(() => setRawPage(1), []);
  const goToLastPage = useCallback(() => setRawPage(totalPages), [totalPages]);
  const goToNextPage = useCallback(() => {
    setRawPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);
  const goToPrevPage = useCallback(() => {
    setRawPage((prev) => Math.max(prev - 1, 1));
  }, []);

  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedFindings,
    setCurrentPage,
    setPageSize,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
  };
}
