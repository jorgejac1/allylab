import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useApp, useNavigation, useCurrentScan, useDrillDown } from "../../context/useAppHooks";
import { AppContext, type AppContextValue } from "../../context/appContextDef";
import type { ReactNode } from "react";
import { createElement } from "react";

const mockContextValue: AppContextValue = {
  activePage: "scan",
  navigate: vi.fn(),
  currentScan: null,
  setCurrentScan: vi.fn(),
  drillDownContext: null,
  setDrillDown: vi.fn(),
  clearDrillDown: vi.fn(),
};

function createWrapper(contextValue: AppContextValue | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      AppContext.Provider,
      { value: contextValue as AppContextValue },
      children
    );
  };
}

describe("context/useAppHooks", () => {
  describe("useApp", () => {
    it("returns context value when inside provider", () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: createWrapper(mockContextValue),
      });

      expect(result.current.activePage).toBe("scan");
      expect(result.current.navigate).toBe(mockContextValue.navigate);
    });

    it("throws error when used outside provider", () => {
      expect(() => {
        renderHook(() => useApp());
      }).toThrow("useApp must be used within an AppProvider");
    });
  });

  describe("useNavigation", () => {
    it("returns activePage and navigate function", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(mockContextValue),
      });

      expect(result.current.activePage).toBe("scan");
      expect(result.current.navigate).toBe(mockContextValue.navigate);
    });
  });

  describe("useCurrentScan", () => {
    it("returns currentScan and setCurrentScan function", () => {
      const { result } = renderHook(() => useCurrentScan(), {
        wrapper: createWrapper(mockContextValue),
      });

      expect(result.current.currentScan).toBeNull();
      expect(result.current.setCurrentScan).toBe(mockContextValue.setCurrentScan);
    });
  });

  describe("useDrillDown", () => {
    it("returns drillDown context and functions", () => {
      const { result } = renderHook(() => useDrillDown(), {
        wrapper: createWrapper(mockContextValue),
      });

      expect(result.current.drillDownContext).toBeNull();
      expect(result.current.setDrillDown).toBe(mockContextValue.setDrillDown);
      expect(result.current.clearDrillDown).toBe(mockContextValue.clearDrillDown);
    });
  });
});
