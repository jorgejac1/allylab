import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";

describe("hooks/useConfirmDialog", () => {
  it("resolves promises on confirm and cancel", async () => {
    const { result } = renderHook(() => useConfirmDialog());

    let resolved: boolean | null = null;
    let promise!: Promise<boolean>;

    act(() => {
      promise = result.current.confirm({ message: "Are you sure?" });
    });
    expect(result.current.isOpen).toBe(true);
    await act(async () => {
      result.current.handleConfirm();
      resolved = await promise;
    });
    expect(resolved).toBe(true);
    expect(result.current.isOpen).toBe(false);

    act(() => {
      promise = result.current.confirm({ message: "Cancel?" });
    });
    await act(async () => {
      result.current.handleCancel();
      resolved = await promise;
    });
    expect(resolved).toBe(false);
  });
});
