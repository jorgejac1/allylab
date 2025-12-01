import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { appendSchedule, useSchedules } from "../../hooks/useSchedules";
import type { Schedule, ScheduleFrequency, ScheduleRunResult } from "../../types";

// Mock API base
const mockGetApiBase = vi.hoisted(() => vi.fn());
vi.mock("../../utils/api", () => ({ getApiBase: mockGetApiBase }));

// Helper to create mock fetch response
function createMockResponse<T>(ok: boolean, data: T) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(data),
  };
}

// Helper to mock fetch with sequential responses
function mockFetchSequence(responses: Array<{ ok: boolean; data: unknown }>) {
  const fetchMock = vi.fn();
  responses.forEach((response) => {
    fetchMock.mockResolvedValueOnce(createMockResponse(response.ok, response.data));
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

// Helper to mock fetch with a single response
function mockFetch<T>(ok: boolean, data: T) {
  const fetchMock = vi.fn().mockResolvedValue(createMockResponse(ok, data));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

// Helper to mock fetch that throws
function mockFetchError(error: unknown) {
  const fetchMock = vi.fn().mockRejectedValue(error);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

const mockSchedule: Schedule = {
  id: "schedule-1",
  url: "https://example.com",
  frequency: "daily" as ScheduleFrequency,
  enabled: true,
  createdAt: new Date().toISOString(),
  nextRun: new Date().toISOString(),
};

const mockRunResult: ScheduleRunResult = {
  scheduleId: "schedule-1",
  url: "https://example.com",
  success: true,
  score: 85,
  totalIssues: 0,
  timestamp: new Date().toISOString(),
};

describe("hooks/useSchedules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApiBase.mockReturnValue("http://api");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial fetch", () => {
    it("fetches schedules on mount", async () => {
      mockFetch(true, { schedules: [mockSchedule] });

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.schedules).toHaveLength(1);
      expect(result.current.schedules[0].id).toBe("schedule-1");
      expect(result.current.error).toBeNull();
    });

    it("handles fetch error with API error message", async () => {
      mockFetch(false, { error: "Server error" });

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch schedules");
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.schedules).toEqual([]);
    });

    it("handles fetch throwing Error", async () => {
      mockFetchError(new Error("Network error"));

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.error).toBe("Network error");
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.schedules).toEqual([]);
    });

    it("handles fetch throwing non-Error", async () => {
      mockFetchError("string error");

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.error).toBe("Unknown error");
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.schedules).toEqual([]);
    });
  });

  describe("refresh", () => {
    it("refreshes schedules", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, data: { schedules: [mockSchedule] } },
        { ok: true, data: { schedules: [mockSchedule, { ...mockSchedule, id: "schedule-2" }] } },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.schedules).toHaveLength(1);
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.schedules).toHaveLength(2);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("createSchedule", () => {
    it("creates a schedule successfully", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [] } },
        { ok: true, data: mockSchedule },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let created: Schedule | null = null;
      await act(async () => {
        created = await result.current.createSchedule("https://example.com", "daily");
      });

      expect(created).not.toBeNull();
      expect(created!.id).toBe("schedule-1");
      expect(result.current.error).toBeNull();
    });

    it("handles create error with API message", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [] } },
        { ok: false, data: { error: "Invalid URL" } },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let created: Schedule | null = null;
      await act(async () => {
        created = await result.current.createSchedule("invalid", "daily");
      });

      expect(created).toBeNull();
      await waitFor(() => {
        expect(result.current.error).toBe("Invalid URL");
      });
    });

    it("handles create error with default message", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [] } },
        { ok: false, data: {} },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createSchedule("https://example.com", "daily");
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to create schedule");
      });
    });

    it("handles create throwing non-Error", async () => {
      mockFetch(true, { schedules: [] });

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Replace fetch to throw non-Error
      mockFetchError("boom");

      await act(async () => {
        await result.current.createSchedule("https://example.com", "daily");
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Unknown error");
      });
    });
  });

  describe("updateSchedule", () => {
    it("updates a schedule successfully", async () => {
      const updatedSchedule = { ...mockSchedule, frequency: "weekly" as ScheduleFrequency };

      mockFetchSequence([
        { ok: true, data: { schedules: [mockSchedule] } },
        { ok: true, data: updatedSchedule },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let updated: Schedule | null = null;
      await act(async () => {
        updated = await result.current.updateSchedule("schedule-1", { frequency: "weekly" });
      });

      expect(updated).not.toBeNull();
      expect(updated!.frequency).toBe("weekly");
    });

    it("replaces only the matching schedule when updating", async () => {
      const second: Schedule = { ...mockSchedule, id: "schedule-2", url: "https://two.com" };
      const patched: Schedule = { ...mockSchedule, frequency: "monthly" as ScheduleFrequency };

      mockFetchSequence([
        { ok: true, data: { schedules: [mockSchedule, second] } },
        { ok: true, data: patched },
      ]);

      const { result } = renderHook(() => useSchedules());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.updateSchedule("schedule-1", { frequency: "monthly" });
      });

      expect(result.current.schedules).toHaveLength(2);
      expect(result.current.schedules[0].frequency).toBe("monthly");
      expect(result.current.schedules[1].id).toBe("schedule-2");
    });

    it("handles update error with API message", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [mockSchedule] } },
        { ok: false, data: { error: "Schedule not found" } },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updated = await act(async () => {
        return await result.current.updateSchedule("invalid-id", { enabled: false });
      });

      expect(updated).toBeNull();
      await waitFor(() => {
        expect(result.current.error).toBe("Schedule not found");
      });
    });

    it("handles update error with default message", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [] } },
        { ok: false, data: {} },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSchedule("1", { enabled: false });
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to update schedule");
      });
    });

    it("handles update throwing non-Error with unknown error", async () => {
      const fetchMock = vi.fn();
      fetchMock
        .mockResolvedValueOnce(createMockResponse(true, { schedules: [mockSchedule] }))
        .mockRejectedValueOnce("boom");
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const { result } = renderHook(() => useSchedules());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.updateSchedule("schedule-1", { enabled: false });
      });

      await waitFor(() => expect(result.current.error).toBe("Unknown error"));
      expect(result.current.schedules).toHaveLength(1);
    });
  });

  describe("deleteSchedule", () => {
    it("deletes a schedule successfully", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [mockSchedule] } },
        { ok: true, data: {} },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let deleted = false;
      await act(async () => {
        deleted = await result.current.deleteSchedule("schedule-1");
      });

      expect(deleted).toBe(true);
    });

    it("handles delete error with API message", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [mockSchedule] } },
        { ok: false, data: { error: "Cannot delete" } },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let deleted = false;
      await act(async () => {
        deleted = await result.current.deleteSchedule("schedule-1");
      });

      expect(deleted).toBe(false);
      await waitFor(() => {
        expect(result.current.error).toBe("Cannot delete");
      });
    });

    it("handles delete error with default message", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [] } },
        { ok: false, data: {} },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteSchedule("1");
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to delete schedule");
      });
    });

    it("handles delete throwing non-Error with unknown error", async () => {
      const fetchMock = vi.fn();
      fetchMock
        .mockResolvedValueOnce(createMockResponse(true, { schedules: [mockSchedule] }))
        .mockRejectedValueOnce("boom");
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const { result } = renderHook(() => useSchedules());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let deleted = true;
      await act(async () => {
        deleted = await result.current.deleteSchedule("schedule-1");
      });

      expect(deleted).toBe(false);
      await waitFor(() => expect(result.current.error).toBe("Unknown error"));
    });
  });

  describe("runNow", () => {
    it("runs a schedule immediately", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [mockSchedule] } },
        { ok: true, data: mockRunResult },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let runResult: ScheduleRunResult | null = null;
      await act(async () => {
        runResult = await result.current.runNow("schedule-1");
      });

      expect(runResult).not.toBeNull();
      expect(runResult!.success).toBe(true);
    });

    it("handles run error with API message", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [mockSchedule] } },
        { ok: false, data: { error: "Schedule disabled" } },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let runResult: ScheduleRunResult | null = null;
      await act(async () => {
        runResult = await result.current.runNow("schedule-1");
      });

      expect(runResult).toBeNull();
      await waitFor(() => {
        expect(result.current.error).toBe("Schedule disabled");
      });
    });

    it("handles run error with default message", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [] } },
        { ok: false, data: {} },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.runNow("1");
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to run schedule");
      });
    });

    it("handles run throwing non-Error with unknown error", async () => {
      const fetchMock = vi.fn();
      fetchMock
        .mockResolvedValueOnce(createMockResponse(true, { schedules: [mockSchedule] }))
        .mockRejectedValueOnce("boom");
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const { result } = renderHook(() => useSchedules());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let runResult: ScheduleRunResult | null = { ...mockRunResult };
      await act(async () => {
        runResult = await result.current.runNow("schedule-1");
      });

      expect(runResult).toBeNull();
      await waitFor(() => expect(result.current.error).toBe("Unknown error"));
    });
  });

  describe("getHistory", () => {
    it("fetches schedule history", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [mockSchedule] } },
        { ok: true, data: { history: [mockRunResult] } },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let history: ScheduleRunResult[] = [];
      await act(async () => {
        history = await result.current.getHistory("schedule-1");
      });

      expect(history).toHaveLength(1);
      expect(history[0].success).toBe(true);
    });

    it("handles history error with API message", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [mockSchedule] } },
        { ok: false, data: { error: "No history found" } },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let history: ScheduleRunResult[] = [];
      await act(async () => {
        history = await result.current.getHistory("schedule-1");
      });

      expect(history).toEqual([]);
      await waitFor(() => {
        expect(result.current.error).toBe("No history found");
      });
    });

    it("handles history error with default message", async () => {
      mockFetchSequence([
        { ok: true, data: { schedules: [] } },
        { ok: false, data: {} },
      ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.getHistory("1");
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to get history");
      });
    });

    it("handles history throwing non-Error with unknown error", async () => {
      const fetchMock = vi.fn();
      fetchMock
        .mockResolvedValueOnce(createMockResponse(true, { schedules: [mockSchedule] }))
        .mockRejectedValueOnce("boom");
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const { result } = renderHook(() => useSchedules());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let history: ScheduleRunResult[] = [{ ...mockRunResult }];
      await act(async () => {
        history = await result.current.getHistory("schedule-1");
      });

      expect(history).toEqual([]);
      await waitFor(() => expect(result.current.error).toBe("Unknown error"));
    });
  });

  describe("appendSchedule", () => {
    it("falls back to empty array when previous state is undefined", () => {
      const schedule: Schedule = { ...mockSchedule, id: "new" };
      const result = appendSchedule(undefined, schedule);
      expect(result).toEqual([schedule]);
    });
  });
});
