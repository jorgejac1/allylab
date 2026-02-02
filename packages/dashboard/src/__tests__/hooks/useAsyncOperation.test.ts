// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useAsyncOperation, useAsyncAction } from "../../hooks/useAsyncOperation";

describe("hooks/useAsyncOperation", () => {
  describe("useAsyncOperation", () => {
    it("starts with initial state", () => {
      const { result } = renderHook(() =>
        useAsyncOperation(async () => "result")
      );

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("executes operation and returns data", async () => {
      const mockOperation = vi.fn().mockResolvedValue({ id: 1, name: "Test" });
      const { result } = renderHook(() => useAsyncOperation(mockOperation));

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.execute();
      });

      expect(result.current.data).toEqual({ id: 1, name: "Test" });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(returnValue).toEqual({ id: 1, name: "Test" });
      expect(mockOperation).toHaveBeenCalled();
    });

    it("sets loading state during execution", async () => {
      let resolvePromise: (value: string) => void;
      const mockOperation = vi.fn().mockImplementation(
        () => new Promise<string>((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useAsyncOperation(mockOperation));

      act(() => {
        result.current.execute();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!("done");
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("handles errors", async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error("Test error"));
      const { result } = renderHook(() => useAsyncOperation(mockOperation));

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.execute();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe("Test error");
      expect(returnValue).toBeNull();
    });

    it("handles string errors", async () => {
      const mockOperation = vi.fn().mockRejectedValue("String error");
      const { result } = renderHook(() => useAsyncOperation(mockOperation));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBe("String error");
    });

    it("handles unknown errors", async () => {
      const mockOperation = vi.fn().mockRejectedValue(123);
      const { result } = renderHook(() => useAsyncOperation(mockOperation));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBe("An unknown error occurred");
    });

    it("resets state", async () => {
      const mockOperation = vi.fn().mockResolvedValue("data");
      const { result } = renderHook(() => useAsyncOperation(mockOperation));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe("data");

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("clears error", async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error("Test error"));
      const { result } = renderHook(() => useAsyncOperation(mockOperation));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBe("Test error");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it("sets data manually", () => {
      const mockOperation = vi.fn().mockResolvedValue("unused");
      const { result } = renderHook(() => useAsyncOperation(mockOperation));

      act(() => {
        result.current.setData("manual data");
      });

      expect(result.current.data).toBe("manual data");
    });

    it("passes arguments to operation", async () => {
      const mockOperation = vi.fn().mockImplementation(
        async (a: number, b: string) => `${a}-${b}`
      );
      const { result } = renderHook(() =>
        useAsyncOperation(mockOperation)
      );

      await act(async () => {
        await result.current.execute(42, "test");
      });

      expect(mockOperation).toHaveBeenCalledWith(42, "test");
      expect(result.current.data).toBe("42-test");
    });

    it("handles race conditions by ignoring stale results", async () => {
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;

      let callCount = 0;
      const mockOperation = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return new Promise<string>((resolve) => { resolveFirst = resolve; });
        }
        return new Promise<string>((resolve) => { resolveSecond = resolve; });
      });

      const { result } = renderHook(() => useAsyncOperation(mockOperation));

      // Start first operation
      act(() => {
        result.current.execute();
      });

      // Start second operation before first completes
      act(() => {
        result.current.execute();
      });

      // Resolve second first
      await act(async () => {
        resolveSecond!("second");
      });

      expect(result.current.data).toBe("second");

      // Resolve first after second - should be ignored
      await act(async () => {
        resolveFirst!("first");
      });

      // Data should still be "second" (first result ignored)
      expect(result.current.data).toBe("second");
    });
  });

  describe("useAsyncAction", () => {
    it("starts with initial state", () => {
      const { result } = renderHook(() =>
        useAsyncAction(async () => {})
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("executes action successfully", async () => {
      const mockAction = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAsyncAction(mockAction));

      let success: boolean = false;
      await act(async () => {
        success = await result.current.execute();
      });

      expect(success).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockAction).toHaveBeenCalled();
    });

    it("handles errors", async () => {
      const mockAction = vi.fn().mockRejectedValue(new Error("Action failed"));
      const { result } = renderHook(() => useAsyncAction(mockAction));

      let success: boolean = true;
      await act(async () => {
        success = await result.current.execute();
      });

      expect(success).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe("Action failed");
    });

    it("clears error", async () => {
      const mockAction = vi.fn().mockRejectedValue(new Error("Action failed"));
      const { result } = renderHook(() => useAsyncAction(mockAction));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBe("Action failed");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it("passes arguments to action", async () => {
      const mockAction = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAsyncAction(mockAction)
      );

      await act(async () => {
        await result.current.execute("arg1", 123);
      });

      expect(mockAction).toHaveBeenCalledWith("arg1", 123);
    });
  });
});
