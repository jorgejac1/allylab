// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { JiraSettings } from "../../../components/settings/JiraSettings";
import { DEFAULT_JIRA_CONFIG, DEFAULT_FIELD_MAPPING } from "../../../types/jira";

const mockUseLocalStorage = vi.fn();

vi.mock("../../../hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useLocalStorage: (key: string, value: unknown) => mockUseLocalStorage(key, value),
  };
});

describe("settings/JiraSettings", () => {
  const makeStore = () => {
    type JiraConfig = typeof DEFAULT_JIRA_CONFIG;
    type JiraMap = typeof DEFAULT_FIELD_MAPPING;
    let cfg: JiraConfig = {
      ...DEFAULT_JIRA_CONFIG,
      enabled: true,
      endpoint: "http://api",
      projectKey: "A11Y",
      authHeader: DEFAULT_JIRA_CONFIG.authHeader || "",
    };
    let map: JiraMap = { ...DEFAULT_FIELD_MAPPING };
    const setConfig = vi.fn((updater: JiraConfig | ((prev: JiraConfig) => JiraConfig)) => {
      cfg = typeof updater === "function" ? (updater as (p: JiraConfig) => JiraConfig)(cfg) : updater;
    });
    const setMapping = vi.fn((updater: JiraMap | ((prev: JiraMap) => JiraMap)) => {
      map = typeof updater === "function" ? (updater as (p: JiraMap) => JiraMap)(map) : updater;
    });
    return { cfg, map, setConfig, setMapping, getConfig: () => cfg, getMap: () => map };
  };

  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    vi.restoreAllMocks();
    (DEFAULT_JIRA_CONFIG as unknown as { authHeader?: string }).authHeader = "";
    store = makeStore();
    mockUseLocalStorage.mockImplementation((key: string) => {
      if (key.includes("config")) return [store.cfg, store.setConfig];
      return [store.map, store.setMapping];
    });
  });

  it("hides advanced settings when disabled", () => {
    store.cfg.enabled = false;
    render(<JiraSettings />);
    expect(screen.queryByText(/Endpoint Configuration/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(store.setConfig).toHaveBeenCalled();
  });

  it("updates fields, saves and resets", async () => {
    render(<JiraSettings />);
    fireEvent.change(screen.getByPlaceholderText("A11Y"), { target: { value: "NEW" } });
    expect(store.setConfig).toHaveBeenCalled();

    const saveBtn = screen.getByRole("button", { name: "Save Settings" });
    fireEvent.click(saveBtn);
    expect(screen.getByText("Saved!")).toBeInTheDocument();

    // Manually trigger animationend event since fake timers don't run CSS animations
    fireEvent.animationEnd(saveBtn);
    expect(screen.getByText("Save Settings")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Reset to Defaults" })[0]);
    expect(store.setConfig).toHaveBeenCalledWith(DEFAULT_JIRA_CONFIG);
    expect(store.setMapping).toHaveBeenCalledWith(DEFAULT_FIELD_MAPPING);
  });

  it("tests connection success, failure, and network error", async () => {
    const okResp = { ok: true, json: vi.fn().mockResolvedValue({ key: "J-1" }) } as unknown as Response;
    const failResp = { ok: false, json: vi.fn().mockResolvedValue({ errorMessages: ["bad"] }) } as unknown as Response;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okResp)
      .mockResolvedValueOnce(failResp)
      .mockRejectedValueOnce(new Error("down"));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<JiraSettings />);

    const testBtn = screen.getAllByRole("button", { name: "Test Connection" })[0];
    fireEvent.click(testBtn);
    await waitFor(() => expect(screen.getByText(/Connected successfully/)).toBeInTheDocument());

    fireEvent.click(testBtn);
    await waitFor(() => expect(screen.getByText(/Error: bad/)).toBeInTheDocument());

    fireEvent.click(testBtn);
    await waitFor(() => expect(screen.getByText(/Network error: down/)).toBeInTheDocument());
  });

  it("falls back to default messages when key/error/status are missing", async () => {
    const okNoKey = { ok: true, json: vi.fn().mockResolvedValue({}) } as unknown as Response;
    const failNoErr = { ok: false, statusText: "Teapot", json: vi.fn().mockResolvedValue({}) } as unknown as Response;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okNoKey)
      .mockResolvedValueOnce(failNoErr)
      .mockRejectedValueOnce(123);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<JiraSettings />);

    const testBtn = screen.getAllByRole("button", { name: "Test Connection" })[0];

    fireEvent.click(testBtn);
    await waitFor(() => expect(screen.getByText(/Test issue: Created/)).toBeInTheDocument());

    fireEvent.click(testBtn);
    await waitFor(() => expect(screen.getByText(/Error: Teapot/)).toBeInTheDocument());

    fireEvent.click(testBtn);
    await waitFor(() => expect(screen.getByText(/Network error: Unknown/)).toBeInTheDocument());
  });

  it("sends auth header when provided", async () => {
    const okResp = { ok: true, json: vi.fn().mockResolvedValue({ key: "J-1" }) } as unknown as Response;
    const fetchMock = vi.fn(async () => okResp);
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    store.cfg.authHeader = "Bearer token123";
    (DEFAULT_JIRA_CONFIG as unknown as { authHeader?: string }).authHeader = "Bearer token123";
    render(<JiraSettings />);
    store.cfg.authHeader = "Bearer token123";

    fireEvent.click(screen.getAllByRole("button", { name: "Test Connection" })[0]);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // Ensure config carried the auth header into the request options
    const firstCall = (fetchMock.mock.calls[0] ?? []) as unknown[];
    const options = firstCall[1] as RequestInit | undefined;
    expect(options?.headers).toBeTruthy();
  });

  it("updates endpoint, authHeader, and issueType fields", () => {
    render(<JiraSettings />);

    // Update endpoint
    screen.getAllByPlaceholderText("https://your-domain.atlassian.net/rest/api/2/issue")
      .forEach(input => fireEvent.change(input, { target: { value: "https://new-endpoint.com" } }));
    expect(store.setConfig).toHaveBeenCalled();

    // Update auth header
    screen.getAllByPlaceholderText("Basic xxx or Bearer xxx").forEach(input => {
      fireEvent.change(input, { target: { value: "Bearer token123" } });
      expect(store.setConfig).toHaveBeenCalled();
    });

    // Update issue type (first combobox in the list)
    const selects = screen.getAllByRole("combobox");
    const issueTypeSelect = selects[0]; // Issue Type is the first select
    fireEvent.change(issueTypeSelect, { target: { value: "Task" } });
    expect(store.setConfig).toHaveBeenCalled();
  });

  it("applies auth header change handler", () => {
    render(<JiraSettings />);
    const authInputs = screen.getAllByPlaceholderText("Basic xxx or Bearer xxx");
    store.setConfig.mockClear();

    authInputs.forEach(input => fireEvent.change(input, { target: { value: "Bearer new" } }));

    expect(store.setConfig).toHaveBeenCalled();
    expect(store.getConfig().authHeader).toBe("Bearer new");
  });
});
