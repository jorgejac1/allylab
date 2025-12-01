import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useToast } from "../../hooks/useToast";

describe("hooks/useToast", () => {
  it("adds toasts and removes them", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("success", "Hello", 1000);
    });
    expect(result.current.toasts.length).toBe(1);
    const id = result.current.toasts[0].id;

    act(() => {
      result.current.error("Oops");
      result.current.closeToast(id);
    });

    expect(result.current.toasts.find((t) => t.id === id)).toBeUndefined();
    expect(result.current.toasts[0]?.type).toBe("error");

    act(() => {
      result.current.success("Great");
      result.current.warning("Heads up");
      result.current.info("FYI");
    });
    const types = result.current.toasts.map((t) => t.type);
    expect(types).toEqual(expect.arrayContaining(["success", "warning", "info"]));
  });
});
