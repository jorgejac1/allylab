// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDrawerState } from "../../hooks/useDrawerState";
import type { TrackedFinding } from "../../types";

vi.mock("../../utils/falsePositives", () => ({
  markAsFalsePositive: vi.fn(),
  unmarkFalsePositive: vi.fn(),
}));

vi.mock("../../utils/api", () => ({
  getApiBase: () => "http://api",
}));

const mockFinding: TrackedFinding = {
  id: "f1",
  ruleId: "rule-1",
  ruleTitle: "Test Rule",
  description: "Description",
  impact: "serious",
  selector: "#test",
  html: "<div>test</div>",
  helpUrl: "https://help.test",
  wcagTags: ["wcag21aa"],
  status: "new",
  fingerprint: "fp123",
};

describe("hooks/useDrawerState", () => {
  const mockOnClose = vi.fn();
  const mockOnFalsePositiveChange = vi.fn();
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
    });
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
        onFalsePositiveChange: mockOnFalsePositiveChange,
      })
    );

    expect(result.current.showFpForm).toBe(false);
    expect(result.current.fpReason).toBe("");
    expect(result.current.copiedSelector).toBe(false);
    expect(result.current.copiedHtml).toBe(false);
    expect(result.current.isGeneratingFix).toBe(false);
    expect(result.current.codeFix).toBeNull();
    expect(result.current.fixError).toBeNull();
    expect(result.current.showApplyFixModal).toBe(false);
  });

  it("toggles false positive form visibility", () => {
    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setShowFpForm(true);
    });
    expect(result.current.showFpForm).toBe(true);

    act(() => {
      result.current.setShowFpForm(false);
    });
    expect(result.current.showFpForm).toBe(false);
  });

  it("sets false positive reason", () => {
    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setFpReason("This is a false positive");
    });
    expect(result.current.fpReason).toBe("This is a false positive");
  });

  it("handles copy selector", async () => {
    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
      })
    );

    await act(async () => {
      await result.current.handleCopy("#test-selector", "selector");
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("#test-selector");
    expect(result.current.copiedSelector).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copiedSelector).toBe(false);
  });

  it("handles copy html", async () => {
    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
      })
    );

    await act(async () => {
      await result.current.handleCopy("<div>html</div>", "html");
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("<div>html</div>");
    expect(result.current.copiedHtml).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copiedHtml).toBe(false);
  });

  it("marks finding as false positive", async () => {
    const { markAsFalsePositive } = await import("../../utils/falsePositives");
    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
        onFalsePositiveChange: mockOnFalsePositiveChange,
      })
    );

    act(() => {
      result.current.setFpReason("Test reason");
      result.current.setShowFpForm(true);
    });

    act(() => {
      result.current.handleMarkFalsePositive();
    });

    expect(markAsFalsePositive).toHaveBeenCalledWith("fp123", "rule-1", "Test reason");
    expect(mockOnFalsePositiveChange).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
    expect(result.current.showFpForm).toBe(false);
    expect(result.current.fpReason).toBe("");
  });

  it("marks finding as false positive without reason", async () => {
    const { markAsFalsePositive } = await import("../../utils/falsePositives");
    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.handleMarkFalsePositive();
    });

    expect(markAsFalsePositive).toHaveBeenCalledWith("fp123", "rule-1", undefined);
  });

  it("does nothing when marking false positive with no finding", () => {
    const { result } = renderHook(() =>
      useDrawerState({
        finding: null,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.handleMarkFalsePositive();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("unmarks false positive", async () => {
    const { unmarkFalsePositive } = await import("../../utils/falsePositives");
    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
        onFalsePositiveChange: mockOnFalsePositiveChange,
      })
    );

    act(() => {
      result.current.handleUnmarkFalsePositive();
    });

    expect(unmarkFalsePositive).toHaveBeenCalledWith("fp123");
    expect(mockOnFalsePositiveChange).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("does nothing when unmarking false positive with no finding", () => {
    const { result } = renderHook(() =>
      useDrawerState({
        finding: null,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.handleUnmarkFalsePositive();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("toggles apply fix modal", () => {
    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setShowApplyFixModal(true);
    });
    expect(result.current.showApplyFixModal).toBe(true);

    act(() => {
      result.current.setShowApplyFixModal(false);
    });
    expect(result.current.showApplyFixModal).toBe(false);
  });

  it("resets all state", async () => {
    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
      })
    );

    // Set various state
    act(() => {
      result.current.setShowFpForm(true);
      result.current.setFpReason("reason");
      result.current.setShowApplyFixModal(true);
    });

    await act(async () => {
      await result.current.handleCopy("text", "selector");
    });

    expect(result.current.showFpForm).toBe(true);
    expect(result.current.fpReason).toBe("reason");
    expect(result.current.showApplyFixModal).toBe(true);
    expect(result.current.copiedSelector).toBe(true);

    // Reset
    act(() => {
      result.current.resetState();
    });

    expect(result.current.showFpForm).toBe(false);
    expect(result.current.fpReason).toBe("");
    expect(result.current.copiedSelector).toBe(false);
    expect(result.current.copiedHtml).toBe(false);
    expect(result.current.isGeneratingFix).toBe(false);
    expect(result.current.codeFix).toBeNull();
    expect(result.current.fixError).toBeNull();
    expect(result.current.showApplyFixModal).toBe(false);
  });

  it("generates enhanced fix successfully", async () => {
    vi.useRealTimers();

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        fix: { original: { code: "old" }, fixes: { html: "new" } },
      }),
    });

    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
      })
    );

    await act(async () => {
      await result.current.handleGenerateEnhancedFix();
    });

    expect(result.current.codeFix).toEqual({ original: { code: "old" }, fixes: { html: "new" } });
    expect(result.current.fixError).toBeNull();
    expect(result.current.isGeneratingFix).toBe(false);
  });

  it("handles fix generation error from API", async () => {
    vi.useRealTimers();

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: false,
        error: "Fix generation failed",
      }),
    });

    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
      })
    );

    await act(async () => {
      await result.current.handleGenerateEnhancedFix();
    });

    expect(result.current.codeFix).toBeNull();
    expect(result.current.fixError).toBe("Fix generation failed");
    expect(result.current.isGeneratingFix).toBe(false);
  });

  it("handles fix generation API error without message", async () => {
    vi.useRealTimers();

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false }),
    });

    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
      })
    );

    await act(async () => {
      await result.current.handleGenerateEnhancedFix();
    });

    expect(result.current.fixError).toBe("Failed to generate fix");
  });

  it("handles fix generation network error", async () => {
    vi.useRealTimers();

    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
      })
    );

    await act(async () => {
      await result.current.handleGenerateEnhancedFix();
    });

    expect(result.current.codeFix).toBeNull();
    expect(result.current.fixError).toBe("Failed to connect to AI service");
    expect(result.current.isGeneratingFix).toBe(false);
  });

  it("handles fix generation non-Error throw", async () => {
    vi.useRealTimers();

    globalThis.fetch = vi.fn().mockRejectedValue("string error");

    const { result } = renderHook(() =>
      useDrawerState({
        finding: mockFinding,
        onClose: mockOnClose,
      })
    );

    await act(async () => {
      await result.current.handleGenerateEnhancedFix();
    });

    expect(result.current.fixError).toBe("Failed to connect to AI service");
  });

  it("does nothing when generating fix with no finding", async () => {
    vi.useRealTimers();

    const { result } = renderHook(() =>
      useDrawerState({
        finding: null,
        onClose: mockOnClose,
      })
    );

    await act(async () => {
      await result.current.handleGenerateEnhancedFix();
    });

    expect(result.current.isGeneratingFix).toBe(false);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
