import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useFindingsPagination } from "../../hooks/useFindingsPagination";
import type { TrackedFinding } from "../../types";

// Create mock findings array
function createFindings(count: number): TrackedFinding[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `finding-${i}`,
    ruleId: `rule-${i}`,
    ruleTitle: `Rule ${i}`,
    description: `Finding ${i}`,
    selector: "div",
    html: "<div></div>",
    impact: "critical" as const,
    helpUrl: "https://help.com",
    wcagTags: ["wcag21aa"],
    status: "new" as const,
    fingerprint: `fingerprint-${i}`,
  }));
}

describe("hooks/useFindingsPagination", () => {
  it("initializes with default page size of 10", () => {
    const findings = createFindings(25);
    const { result } = renderHook(() => useFindingsPagination(findings));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.paginatedFindings).toHaveLength(10);
  });

  it("uses custom initial page size", () => {
    const findings = createFindings(25);
    const { result } = renderHook(() => useFindingsPagination(findings, 5));

    expect(result.current.pageSize).toBe(5);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.paginatedFindings).toHaveLength(5);
  });

  it("setCurrentPage changes the page", () => {
    const findings = createFindings(25);
    const { result } = renderHook(() => useFindingsPagination(findings));

    act(() => {
      result.current.setCurrentPage(2);
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedFindings[0].id).toBe("finding-10");
  });

  it("setPageSize changes page size and resets to page 1", () => {
    const findings = createFindings(25);
    const { result } = renderHook(() => useFindingsPagination(findings));

    act(() => {
      result.current.setCurrentPage(3);
    });
    expect(result.current.currentPage).toBe(3);

    act(() => {
      result.current.setPageSize(5);
    });

    expect(result.current.pageSize).toBe(5);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(5);
  });

  it("goToFirstPage navigates to page 1", () => {
    const findings = createFindings(25);
    const { result } = renderHook(() => useFindingsPagination(findings));

    act(() => {
      result.current.setCurrentPage(3);
    });
    expect(result.current.currentPage).toBe(3);

    act(() => {
      result.current.goToFirstPage();
    });
    expect(result.current.currentPage).toBe(1);
  });

  it("goToLastPage navigates to last page", () => {
    const findings = createFindings(25);
    const { result } = renderHook(() => useFindingsPagination(findings));

    act(() => {
      result.current.goToLastPage();
    });

    expect(result.current.currentPage).toBe(3);
  });

  it("goToNextPage increments page", () => {
    const findings = createFindings(25);
    const { result } = renderHook(() => useFindingsPagination(findings));

    act(() => {
      result.current.goToNextPage();
    });

    expect(result.current.currentPage).toBe(2);
  });

  it("goToNextPage does not exceed total pages", () => {
    const findings = createFindings(25);
    const { result } = renderHook(() => useFindingsPagination(findings));

    act(() => {
      result.current.setCurrentPage(3);
    });

    act(() => {
      result.current.goToNextPage();
    });

    expect(result.current.currentPage).toBe(3);
  });

  it("goToPrevPage decrements page", () => {
    const findings = createFindings(25);
    const { result } = renderHook(() => useFindingsPagination(findings));

    act(() => {
      result.current.setCurrentPage(3);
    });

    act(() => {
      result.current.goToPrevPage();
    });

    expect(result.current.currentPage).toBe(2);
  });

  it("goToPrevPage does not go below 1", () => {
    const findings = createFindings(25);
    const { result } = renderHook(() => useFindingsPagination(findings));

    act(() => {
      result.current.goToPrevPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it("clamps currentPage to totalPages when data shrinks", () => {
    const findings = createFindings(25);
    const { result, rerender } = renderHook(
      ({ data }) => useFindingsPagination(data),
      { initialProps: { data: findings } }
    );

    act(() => {
      result.current.setCurrentPage(3);
    });
    expect(result.current.currentPage).toBe(3);

    // Reduce findings to only fit 2 pages
    rerender({ data: createFindings(15) });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.totalPages).toBe(2);
  });

  it("handles empty findings array", () => {
    const { result } = renderHook(() => useFindingsPagination([]));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.paginatedFindings).toHaveLength(0);
  });

  it("clamps rawPage to 1 if less than 1", () => {
    const findings = createFindings(25);
    const { result } = renderHook(() => useFindingsPagination(findings));

    // Try to set page to 0 or negative
    act(() => {
      result.current.setCurrentPage(0);
    });

    expect(result.current.currentPage).toBe(1);
  });
});
