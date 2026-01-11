import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { SettingsPage } from "../../pages/SettingsPage";
import { mockUseConfirmDialog, mockUseLocalStorage, mockUseToast } from "../__mocks__/hooks";

vi.mock("../../components/layout", () => import("../__mocks__/pageComponents"));
vi.mock("../../components/settings", () => import("../__mocks__/pageComponents"));
vi.mock("../../components/ui", () => import("../__mocks__/pageComponents"));
vi.mock("../../hooks", () => import("../__mocks__/hooks"));

const defaultSettings = {
  defaultStandard: "wcag21aa",
  includeWarnings: false,
  autoSave: true,
  maxScansStored: 100,
};

describe("pages/SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves settings and toggles saved state on change", async () => {
    vi.useFakeTimers();
    const setSettings = vi.fn();
    const success = vi.fn();
    mockUseLocalStorage.mockReturnValue([defaultSettings, setSettings]);
    mockUseConfirmDialog.mockReturnValue({
      isOpen: false,
      options: { title: "", message: "", confirmLabel: "", cancelLabel: "", variant: "info" },
      confirm: vi.fn().mockResolvedValue(false),
      handleConfirm: vi.fn(),
      handleCancel: vi.fn(),
    });
    mockUseToast.mockReturnValue({ toasts: [], success, closeToast: vi.fn() });

    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /Save Settings/i }));
    expect(success).toHaveBeenCalledWith("Settings saved successfully");
    expect(screen.getByRole("button", { name: /✓ Saved!/i })).toBeInTheDocument();
    vi.advanceTimersByTime(2000);

    fireEvent.change(screen.getByTestId("select"), { target: { value: "wcag22aa" } });
    expect(typeof setSettings.mock.calls[0][0]).toBe("function");
    expect(screen.getByRole("button", { name: /Save Settings/i })).toBeInTheDocument();

    const includeWarningsCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(includeWarningsCheckbox);
    const includeUpdate = setSettings.mock.calls[setSettings.mock.calls.length - 1]?.[0] as (prev: typeof defaultSettings) => typeof defaultSettings;
    expect(includeUpdate(defaultSettings).includeWarnings).toBe(true);

    const autoSaveCheckbox = screen.getAllByRole("checkbox")[1];
    fireEvent.click(autoSaveCheckbox);
    const maxInput = screen.getByTestId("input");
    fireEvent.change(maxInput, { target: { value: "150" } });
    const maxStoredUpdate = setSettings.mock.calls[setSettings.mock.calls.length - 1]?.[0] as (prev: typeof defaultSettings) => typeof defaultSettings;
    expect(maxStoredUpdate(defaultSettings).maxScansStored).toBe(150);

    fireEvent.change(maxInput, { target: { value: "abc" } });
    const fallbackUpdate = setSettings.mock.calls[setSettings.mock.calls.length - 1]?.[0] as (prev: typeof defaultSettings) => typeof defaultSettings;
    expect(fallbackUpdate(defaultSettings).maxScansStored).toBe(100);
    vi.useRealTimers();
  });

  it("clears stored data after confirmation", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const originalWindow = globalThis.window;
    const originalLocation = globalThis.location;
    const originalLocalStorage = globalThis.localStorage;
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    } as unknown as Storage;
    const reload = vi.fn();
    const windowStub = {
      ...(originalWindow as object),
      localStorage: storage,
      location: { ...(originalLocation as object), reload },
    } as unknown as Window & typeof globalThis;
    Object.defineProperty(globalThis, "window", { value: windowStub, configurable: true });
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });

    mockUseLocalStorage.mockReturnValue([defaultSettings, vi.fn()]);
    mockUseConfirmDialog.mockReturnValue({
      isOpen: false,
      options: { title: "", message: "", confirmLabel: "", cancelLabel: "", variant: "info" },
      confirm: vi.fn().mockResolvedValue(true),
      handleConfirm: vi.fn(),
      handleCancel: vi.fn(),
    });
    mockUseToast.mockReturnValue({ toasts: [], success: vi.fn(), closeToast: vi.fn() });

    render(<SettingsPage />, { container });

    fireEvent.click(screen.getByRole("button", { name: /Clear All Data/i }));

    await Promise.resolve();
    expect(storage.removeItem).toHaveBeenCalledWith("allylab_scans");
    expect(storage.removeItem).toHaveBeenCalledWith("allylab_tracked_issues");
    expect(reload).toHaveBeenCalled();

    Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
    Object.defineProperty(globalThis, "location", { value: originalLocation, configurable: true });
    Object.defineProperty(globalThis, "localStorage", { value: originalLocalStorage, configurable: true });
    container.remove();
  });

  it("does nothing when destructive actions are cancelled", async () => {
    vi.useRealTimers();
    const setSettings = vi.fn();
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    } as unknown as Storage;
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    mockUseLocalStorage.mockImplementation((key: string, initial: unknown) => {
      if (key === "allylab_settings") return [defaultSettings, setSettings];
      return [initial, vi.fn()];
    });
    mockUseConfirmDialog.mockReturnValue({
      isOpen: false,
      options: { title: "", message: "", confirmLabel: "", cancelLabel: "", variant: "info" },
      confirm: vi.fn().mockResolvedValue(false),
      handleConfirm: vi.fn(),
      handleCancel: vi.fn(),
    });
    mockUseToast.mockReturnValue({ toasts: [], success: vi.fn(), closeToast: vi.fn() });

    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /Reset to Defaults/i }));
    fireEvent.click(screen.getByRole("button", { name: /Clear All Data/i }));

    await Promise.resolve();
    expect(setSettings).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it("resets settings to defaults when confirmed", async () => {
    vi.useRealTimers();
    const setSettings = vi.fn();
    mockUseLocalStorage.mockReturnValue([defaultSettings, setSettings]);
    mockUseConfirmDialog.mockReturnValue({
      isOpen: false,
      options: { title: "", message: "", confirmLabel: "", cancelLabel: "", variant: "info" },
      confirm: vi.fn().mockResolvedValue(true),
      handleConfirm: vi.fn(),
      handleCancel: vi.fn(),
    });
    const success = vi.fn();
    mockUseToast.mockReturnValue({ toasts: [], success, closeToast: vi.fn() });

    const container = document.createElement("div");
    document.body.appendChild(container);
    render(<SettingsPage />, { container });

    fireEvent.click(screen.getByRole("button", { name: /Reset to Defaults/i }));

    await Promise.resolve();
    expect(setSettings).toHaveBeenCalledWith(defaultSettings);
    expect(success).toHaveBeenCalledWith("Settings reset to defaults");
    container.remove();
  });

  it("handles API settings interactions", async () => {
    const setSettings = vi.fn();
    const setApiUrl = vi.fn();
    const success = vi.fn();
    mockUseLocalStorage.mockImplementation((key: string, initial: unknown) => {
      if (key === "allylab_settings") return [defaultSettings, setSettings];
      if (key === "allylab_api_url") return ["http://initial", setApiUrl];
      return [initial, vi.fn()];
    });
    mockUseConfirmDialog.mockReturnValue({
      isOpen: false,
      options: { title: "", message: "", confirmLabel: "", cancelLabel: "", variant: "info" },
      confirm: vi.fn().mockResolvedValue(false),
      handleConfirm: vi.fn(),
      handleCancel: vi.fn(),
    });
    mockUseToast.mockReturnValue({ toasts: [], success, closeToast: vi.fn() });
    const writeText = vi.fn().mockResolvedValue(undefined);
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "API" }));
    const apiInput = screen.getByTestId("input");
    fireEvent.change(apiInput, { target: { value: "http://new" } });
    await Promise.resolve();
    expect(setApiUrl).toHaveBeenCalledWith("http://new");

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await Promise.resolve();
    expect(setApiUrl).toHaveBeenCalledWith("http://localhost:3001");

    fireEvent.click(screen.getByRole("button", { name: /Copy cURL/i }));
    await Promise.resolve();
    expect(writeText).toHaveBeenCalled();
    expect(success).toHaveBeenCalledWith("Copied to clipboard");

    const copyButtons = screen.getAllByRole("button", { name: "📋" });
    fireEvent.click(copyButtons[0]);
    await waitFor(() => {
      expect(success).toHaveBeenCalled();
    });

    Object.defineProperty(globalThis.navigator, "clipboard", { value: originalClipboard, configurable: true });
  });

  it("renders tab-specific content when selecting tabs", () => {
    mockUseLocalStorage.mockImplementation((key: string, initial: unknown) => {
      if (key === "allylab_settings") return [defaultSettings, vi.fn()];
      if (key === "allylab_api_url") return ["http://initial", vi.fn()];
      return [initial, vi.fn()];
    });
    mockUseConfirmDialog.mockReturnValue({
      isOpen: false,
      options: { title: "", message: "", confirmLabel: "", cancelLabel: "", variant: "info" },
      confirm: vi.fn().mockResolvedValue(false),
      handleConfirm: vi.fn(),
      handleCancel: vi.fn(),
    });
    mockUseToast.mockReturnValue({ toasts: [], success: vi.fn(), closeToast: vi.fn() });

    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Reports" }));
    expect(screen.getByTestId("report-settings")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Alerts" }));
    expect(screen.getByTestId("alert-settings")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Rules" }));
    expect(screen.getByTestId("custom-rules-manager")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "CI/CD" }));
    expect(screen.getByTestId("cicd-generator")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Scheduled Scans" }));
    expect(screen.getByTestId("schedule-manager")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByTestId("webhook-manager")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "JIRA" }));
    expect(screen.getByTestId("jira-settings")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "GitHub" }));
    expect(screen.getByTestId("github-settings")).toBeInTheDocument();
  });
});
