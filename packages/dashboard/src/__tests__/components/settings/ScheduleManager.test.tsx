import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { ScheduleManager } from "../../../components/settings/ScheduleManager";
import type { Schedule, ScheduleRunResult } from "../../../types";

const mockUseSchedules = vi.fn();

vi.mock("../../../hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useSchedules: () => mockUseSchedules(),
  };
});

describe("settings/ScheduleManager", () => {
  const baseSchedule: Schedule = {
    id: "1",
    url: "https://example.com",
    frequency: "daily",
    enabled: true,
    lastRun: new Date().toISOString(),
    nextRun: new Date(Date.now() + 3600000).toISOString(),
    lastScore: 95,
    createdAt: new Date().toISOString(),
  };

  const history: ScheduleRunResult[] = [
    { scheduleId: "1", success: true, score: 90, totalIssues: 2, timestamp: new Date().toISOString(), url: "https://example.com" },
    { scheduleId: "1", success: false, score: 0, totalIssues: 0, timestamp: new Date().toISOString(), error: "fail", url: "https://example.com" },
  ];

  const makeReturn = (overrides = {}) => ({
    schedules: [baseSchedule],
    isLoading: false,
    error: null,
    createSchedule: vi.fn().mockResolvedValue(baseSchedule),
    updateSchedule: vi.fn().mockResolvedValue(baseSchedule),
    deleteSchedule: vi.fn().mockResolvedValue(true),
    runNow: vi.fn().mockResolvedValue(history[0]),
    getHistory: vi.fn().mockResolvedValue(history),
    ...overrides,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as unknown as { confirm: () => boolean }).confirm = vi.fn(() => true);
    mockUseSchedules.mockReturnValue(makeReturn());
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading and error states", () => {
    mockUseSchedules.mockReturnValueOnce({ ...makeReturn(), isLoading: true });
    const { rerender } = render(<ScheduleManager />);
    expect(screen.getByText(/Loading schedules/)).toBeInTheDocument();

    mockUseSchedules.mockReturnValueOnce({ ...makeReturn(), error: "err" });
    rerender(<ScheduleManager />);
    expect(screen.getByText("err")).toBeInTheDocument();
  });

  it("creates schedule, toggles, runs, deletes and views history", async () => {
    const scheduleFns = makeReturn();
    mockUseSchedules.mockReturnValue(scheduleFns);
    render(<ScheduleManager />);

    fireEvent.change(screen.getAllByPlaceholderText("https://example.com")[0], { target: { value: "https://a.com" } });
    fireEvent.click(screen.getAllByRole("button", { name: "+ Add Schedule" })[0]);
    await waitFor(() => expect(scheduleFns.createSchedule).toHaveBeenCalledWith("https://a.com", "daily"));
    expect(screen.getAllByPlaceholderText("https://example.com")[0]).toHaveValue(""); // cleared after success

    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(scheduleFns.updateSchedule).toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: /Run/ })[0]);
    await waitFor(() => expect(scheduleFns.runNow).toHaveBeenCalledWith("1"));

    fireEvent.click(screen.getAllByTitle("View history")[0]);
    await waitFor(() => expect(scheduleFns.getHistory).toHaveBeenCalledWith("1"));
    expect(await screen.findByText(/Scan History/)).toBeInTheDocument();
    expect(await screen.findByText("fail")).toBeInTheDocument();
    fireEvent.click(screen.getByText("✕"));

    fireEvent.click(screen.getAllByTitle("Delete schedule")[0]);
    await waitFor(() => expect(scheduleFns.deleteSchedule).toHaveBeenCalledWith("1"));
  });

  it("shows empty state and disables create for blank url", () => {
    mockUseSchedules.mockReturnValueOnce({ ...makeReturn(), schedules: [] });
    render(<ScheduleManager />);
    expect(screen.getByText("No Scheduled Scans")).toBeInTheDocument();
    const addButtons = screen.getAllByRole("button", { name: "+ Add Schedule" });
    expect(addButtons[0]).toBeDisabled();
  });

  it("handles Enter key to create schedule", async () => {
    const createSchedule = vi.fn().mockResolvedValue(baseSchedule);
    mockUseSchedules.mockReturnValue(makeReturn({ createSchedule }));
    render(<ScheduleManager />);

    const input = screen.getAllByPlaceholderText("https://example.com")[0];
    fireEvent.change(input, { target: { value: "https://test.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(createSchedule).toHaveBeenCalledWith("https://test.com", "daily"));
  });

  it("ignores Enter when URL is only whitespace", async () => {
    const createSchedule = vi.fn().mockResolvedValue(baseSchedule);
    mockUseSchedules.mockReturnValue(makeReturn({ createSchedule }));
    render(<ScheduleManager />);

    const input = screen.getAllByPlaceholderText("https://example.com")[0];
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(createSchedule).not.toHaveBeenCalled());
  });

  it("displays various score colors", () => {
    const schedules: Schedule[] = [
      { ...baseSchedule, id: "1", lastScore: 95 }, // green >= 90
      { ...baseSchedule, id: "2", lastScore: 75 }, // orange >= 70
      { ...baseSchedule, id: "3", lastScore: 55 }, // dark orange >= 50
      { ...baseSchedule, id: "4", lastScore: 30 }, // red < 50
    ];
    mockUseSchedules.mockReturnValue(makeReturn({ schedules }));
    render(<ScheduleManager />);

    expect(screen.getAllByText("95")[0]).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
    expect(screen.getByText("30")).toHaveStyle({ color: "#dc2626" });
  });

  it("formats next run time correctly", () => {
    const now = new Date();
    const schedules: Schedule[] = [
      { ...baseSchedule, id: "1", nextRun: new Date(now.getTime() + 30 * 60000).toISOString() }, // 30 minutes
      { ...baseSchedule, id: "2", nextRun: new Date(now.getTime() + 5 * 3600000).toISOString() }, // 5 hours
      { ...baseSchedule, id: "3", nextRun: new Date(now.getTime() + 3 * 86400000).toISOString() }, // 3 days
    ];
    mockUseSchedules.mockReturnValue(makeReturn({ schedules }));
    render(<ScheduleManager />);

    // Should show formatted times (actual values depend on formatNextRun logic)
    expect(screen.getByText(/30m/)).toBeInTheDocument();
    expect(screen.getByText(/5h/)).toBeInTheDocument();
    expect(screen.getByText(/3d/)).toBeInTheDocument();
  });

  it("returns early when URL is whitespace", async () => {
    const createSchedule = vi.fn().mockResolvedValue(baseSchedule);
    mockUseSchedules.mockReturnValue(makeReturn({ createSchedule }));
    render(<ScheduleManager />);

    const input = screen.getAllByPlaceholderText("https://example.com")[0];
    const addButton = screen.getAllByRole("button", { name: "+ Add Schedule" })[0];

    // Test with empty URL
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(addButton);
    expect(createSchedule).not.toHaveBeenCalled();

    // Test with whitespace-only URL
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(addButton);
    expect(createSchedule).not.toHaveBeenCalled();

    // Test with spaces and tabs
    fireEvent.change(input, { target: { value: "  \t  " } });
    fireEvent.click(addButton);
    expect(createSchedule).not.toHaveBeenCalled();
  });

  it("keeps input when create fails", async () => {
    const createSchedule = vi.fn().mockResolvedValue(null);
    mockUseSchedules.mockReturnValue(makeReturn({ createSchedule }));
    render(<ScheduleManager />);

    const input = screen.getAllByPlaceholderText("https://example.com")[0];

    // Test when createSchedule fails (returns null) - input should not be cleared
    fireEvent.change(input, { target: { value: "https://fail.com" } });
    fireEvent.click(screen.getAllByRole("button", { name: "+ Add Schedule" })[0]);

    await waitFor(() => expect(createSchedule).toHaveBeenCalledWith("https://fail.com", "daily"));

    // Input should still have the value since createSchedule returned null
    expect(input).toHaveValue("https://fail.com");
  });

  it("changes new schedule frequency before creating", async () => {
    const createSchedule = vi.fn().mockResolvedValue(baseSchedule);
    mockUseSchedules.mockReturnValue(makeReturn({ createSchedule }));
    render(<ScheduleManager />);

    const input = screen.getAllByPlaceholderText("https://example.com")[0];
    const frequencySelect = screen.getAllByRole("combobox")[0]; // First select is the new schedule frequency

    // Change frequency to weekly
    fireEvent.change(frequencySelect, { target: { value: "weekly" } });

    // Add schedule with the selected frequency
    fireEvent.change(input, { target: { value: "https://weekly.com" } });
    fireEvent.click(screen.getAllByRole("button", { name: "+ Add Schedule" })[0]);

    await waitFor(() => expect(createSchedule).toHaveBeenCalledWith("https://weekly.com", "weekly"));
  });

  it("does not delete when confirmation is cancelled", async () => {
    const deleteSchedule = vi.fn();
    (globalThis as unknown as { confirm: () => boolean }).confirm = vi.fn(() => false);
    mockUseSchedules.mockReturnValue(makeReturn({ deleteSchedule }));
    render(<ScheduleManager />);

    fireEvent.click(screen.getAllByTitle("Delete schedule")[0]);
    await waitFor(() => expect(deleteSchedule).not.toHaveBeenCalled());
  });

  it("updates schedule frequency from row select", async () => {
    const updateSchedule = vi.fn();
    mockUseSchedules.mockReturnValue(makeReturn({ updateSchedule }));
    render(<ScheduleManager />);

    const selects = screen.getAllByRole("combobox");
    const rowSelect = selects[selects.length - 1];
    fireEvent.change(rowSelect, { target: { value: "weekly" } });

    expect(updateSchedule).toHaveBeenCalledWith("1", { frequency: "weekly" });
  });

  it("shows disabled schedule styles", () => {
    const disabledSchedule = { ...baseSchedule, enabled: false };
    mockUseSchedules.mockReturnValue(makeReturn({ schedules: [disabledSchedule] }));
    render(<ScheduleManager />);

    const disabledCheckbox = screen.getByRole("checkbox", { checked: false }) as HTMLInputElement;
    const row = disabledCheckbox.closest("div") as HTMLElement;
    expect(row).toHaveStyle({ background: "#fafafa", opacity: "0.7" });
  });

  it("shows empty history message with styling", async () => {
    const getHistory = vi.fn().mockResolvedValue([]);
    mockUseSchedules.mockReturnValue(makeReturn({ getHistory }));
    render(<ScheduleManager />);

    const historyBtn = screen.getAllByTitle("View history")[0];
    fireEvent.click(historyBtn);
    await waitFor(() => expect(getHistory).toHaveBeenCalledWith("1"));
    const emptyState = await screen.findByText("No scan history yet");
    expect(emptyState).toHaveStyle({ padding: "40px", textAlign: "center", color: "#64748b" });
  });
});
