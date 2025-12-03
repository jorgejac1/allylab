// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AlertSettings } from "../../../components/settings/AlertSettings";

const mockUseAlertSettings = vi.fn();

vi.mock("../../../hooks", () => ({
  useAlertSettings: () => mockUseAlertSettings(),
}));

describe("settings/AlertSettings", () => {
  const defaults = {
    regressionThreshold: 5,
    recentDays: 7,
    showRegressionAlerts: true,
  };

  const makeHookReturn = (overrides = {}) => ({
    settings: defaults,
    defaults,
    updateSettings: vi.fn(),
    resetToDefaults: vi.fn(),
    ...overrides,
  });

  it("toggles alerts and saves changes", () => {
    const updateSettings = vi.fn();
    mockUseAlertSettings.mockReturnValue(makeHookReturn({ updateSettings }));

    render(<AlertSettings />);

    const checkbox = screen.getByRole("checkbox");
    const saveButton = screen.getByRole("button", { name: "Saved" });
    expect(saveButton).toBeDisabled();

    fireEvent.click(checkbox);
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(updateSettings).toHaveBeenCalled();
  });

  it("resets to defaults and hides preview when alerts disabled", () => {
    const resetToDefaults = vi.fn();
    mockUseAlertSettings.mockReturnValue(
      makeHookReturn({
        resetToDefaults,
        settings: { ...defaults, showRegressionAlerts: false },
      })
    );

    render(<AlertSettings />);
    expect(screen.queryByText(/Preview/)).not.toBeInTheDocument();

    screen.getAllByRole("button", { name: "Reset to Defaults" }).forEach(btn => fireEvent.click(btn));
    expect(resetToDefaults).toHaveBeenCalled();
  });

  it("changes regression threshold and recent days", () => {
    const updateSettings = vi.fn();
    mockUseAlertSettings.mockReturnValue(makeHookReturn({ updateSettings }));

    render(<AlertSettings />);

    const inputs = screen.getAllByRole("spinbutton");
    const regressionInput = inputs[0]; // regressionThreshold
    const recentDaysInput = inputs[1]; // recentDays

    // Change regression threshold
    fireEvent.change(regressionInput, { target: { value: "10" } });
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();

    // Change recent days
    fireEvent.change(recentDaysInput, { target: { value: "14" } });

    // Save changes
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(updateSettings).toHaveBeenCalledWith({
      ...defaults,
      regressionThreshold: 10,
      recentDays: 14,
    });
  });

  it("falls back to minimum values when inputs are empty", () => {
    const updateSettings = vi.fn();
    mockUseAlertSettings.mockReturnValue(makeHookReturn({ updateSettings }));

    render(<AlertSettings />);

    const [regressionInput, recentDaysInput] = screen.getAllByRole("spinbutton");

    fireEvent.change(regressionInput, { target: { value: "" } });
    fireEvent.change(recentDaysInput, { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(updateSettings).toHaveBeenCalledWith({
      ...defaults,
      regressionThreshold: 1,
      recentDays: 1,
    });
  });
});
