import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useAlertSettings } from "../../hooks/useAlertSettings";
import * as alertModule from "../../utils/alertSettings";
import type { AlertSettings } from "../../types";

describe("hooks/useAlertSettings", () => {
  const initialSettings: AlertSettings = {
    regressionThreshold: 10,
    recentDays: 14,
    showRegressionAlerts: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(alertModule, "loadAlertSettings").mockReturnValue(initialSettings);
    vi.spyOn(alertModule, "saveAlertSettings").mockImplementation(() => {});
  });

  it("loads settings and updates them", () => {
    const { result } = renderHook(() => useAlertSettings());
    expect(result.current.settings).toEqual(initialSettings);

    const updates: Partial<AlertSettings> = { regressionThreshold: 5, showRegressionAlerts: true };
    act(() => {
      result.current.updateSettings(updates);
    });

    expect(result.current.settings.regressionThreshold).toBe(5);
    expect(result.current.settings.showRegressionAlerts).toBe(true);
    expect(alertModule.saveAlertSettings).toHaveBeenCalledWith({
      ...initialSettings,
      ...updates,
    });
  });

  it("resets to defaults", () => {
    const defaults = { ...alertModule.DEFAULT_ALERT_SETTINGS };
    const saveSpy = vi.spyOn(alertModule, "saveAlertSettings");
    const { result } = renderHook(() => useAlertSettings());

    act(() => {
      result.current.resetToDefaults();
    });

    expect(result.current.settings).toEqual(defaults);
    expect(saveSpy).toHaveBeenCalledWith(defaults);
  });
});
