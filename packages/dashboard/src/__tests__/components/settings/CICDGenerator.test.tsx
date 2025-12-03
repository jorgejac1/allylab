// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CICDGenerator } from "../../../components/settings/CICDGenerator";

const mockGetScannedUrls = vi.fn(() => ["https://site-a.com", "https://site-b.com"]);
vi.mock("../../../utils/storage", () => ({
  getScannedUrls: () => mockGetScannedUrls(),
}));

describe("settings/CICDGenerator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const clipboardMock: Partial<Clipboard> = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, "clipboard", {
      value: clipboardMock as Clipboard,
      configurable: true,
    });

    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn(() => "blob:config"),
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: vi.fn(),
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  it("generates config, manages urls, copies and downloads", async () => {
    const { container } = render(<CICDGenerator />);

    // Add URL and ensure it appears
    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "https://new.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("https://new.com")).toBeInTheDocument();

    // Remove URL
    const removeButtons = screen.getAllByText("×");
    fireEvent.click(removeButtons[removeButtons.length - 1]);
    expect(screen.queryByText("https://new.com")).not.toBeInTheDocument();

    // Change platform and schedule to exercise generator branches
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "gitlab" } });
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "daily" } });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "85" } });

    // Copy should toggle copied label
    fireEvent.click(screen.getByText("📋 Copy"));
    await vi.waitFor(() => expect(screen.getByText("✓ Copied!")).toBeInTheDocument());
    vi.advanceTimersByTime(2000);
    await vi.waitFor(() => expect(screen.getByText("📋 Copy")).toBeInTheDocument());

    // Generated config reflects selections
    expect(container.textContent).toContain(".gitlab-ci.yml");
    expect(container.textContent).toContain("schedule");
    expect(container.textContent).toContain("THRESHOLD: \"85\"");
  });

  it("generates Harness pipeline config", () => {
    render(<CICDGenerator />);
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "harness" } });
    expect(screen.getByText("harness-pipeline.yaml")).toBeInTheDocument();
    expect(screen.getByText(/pipeline:/)).toBeInTheDocument();
    expect(screen.getByText(/projectIdentifier/)).toBeInTheDocument();
  });

  it("handles Enter key to add URL", () => {
    render(<CICDGenerator />);

    const input = screen.getAllByPlaceholderText("https://example.com")[0];
    fireEvent.change(input, { target: { value: "https://enter.com" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("https://enter.com")).toBeInTheDocument();
  });

  it("downloads generated config file", () => {
    const createElementSpy = vi.spyOn(document, "createElement");

    render(<CICDGenerator />);

    // Click download button
    const downloadButtons = screen.getAllByRole("button", { name: "⬇️ Download" });
    fireEvent.click(downloadButtons[0]);

    // Verify download link was created
    expect(createElementSpy).toHaveBeenCalledWith("a");
  });

  it("falls back to pipeline.yml when filename is empty", () => {
    const realCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, "createElement");
    let anchor: HTMLAnchorElement | null = null;
    createElementSpy.mockImplementation((tagName: string) => {
      const el = realCreateElement(tagName);
      if (tagName === "a") anchor = el as HTMLAnchorElement;
      return el;
    });

    render(<CICDGenerator />);
    const platformSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    fireEvent.change(platformSelect, { target: { value: "" } });

    const downloadBtn = screen.getAllByRole("button", { name: "⬇️ Download" })[0];
    fireEvent.click(downloadBtn);

    expect(anchor).not.toBeNull();
    expect(anchor!.download).toBe("pipeline.yml");
    createElementSpy.mockRestore();
  });

  it("toggles failOnSerious checkbox", () => {
    render(<CICDGenerator />);

    const checkboxes = screen.getAllByRole("checkbox");
    const failOnSeriousCheckbox = checkboxes[1]; // Second checkbox

    // Toggle failOnSerious
    fireEvent.click(failOnSeriousCheckbox);

    // Verify checkbox is checked
    expect(failOnSeriousCheckbox).toBeChecked();
  });

  it("covers default config branch, checkbox toggles, and saved URL hint", () => {
    render(<CICDGenerator />);

    // Toggle failOnCritical (starts true) and uploadArtifacts (starts true) to hit handlers
    const failOnCritical = screen.getAllByLabelText("Fail build on critical issues")[0];
    fireEvent.click(failOnCritical);
    expect(screen.getAllByLabelText("Fail build on critical issues")[0]).not.toBeChecked();
    const uploadArtifacts = screen.getAllByLabelText("Upload results as artifact")[0];
    fireEvent.click(uploadArtifacts);
    expect(screen.getAllByLabelText("Upload results as artifact")[0]).not.toBeChecked();

    // Remove all URLs to show saved URLs hint (line 410)
    screen.getAllByText("×").forEach(btn => fireEvent.click(btn));
    const hints = screen.getAllByText(/Add URLs or choose from your scanned sites/);
    expect(hints.length).toBeGreaterThan(0);

    // Force unknown platform to hit generateConfig default branch (line 219)
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "unknown" } });
    const codeBlock = document.querySelector("div[style*='white-space: pre']");
    expect(codeBlock).not.toBeNull();
    expect(codeBlock?.textContent ?? "").toBe("");
  });

  it("handles GitHub schedule variations and GitLab allow_failure", async () => {
    render(<CICDGenerator />);

    const scheduleSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    // GitHub daily schedule cron
    fireEvent.change(scheduleSelect, { target: { value: "daily" } });
    expect(scheduleSelect.value).toBe("daily");

    // Weekly schedule cron
    fireEvent.change(scheduleSelect, { target: { value: "weekly" } });
    expect(scheduleSelect.value).toBe("weekly");

    // Manual triggers workflow_dispatch
    fireEvent.change(scheduleSelect, { target: { value: "manual" } });
    expect(scheduleSelect.value).toBe("manual");

    // Switch to GitLab, disable failOnCritical to allow failure
    const platformSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    fireEvent.change(platformSelect, { target: { value: "gitlab" } });
    fireEvent.click(screen.getAllByLabelText("Fail build on critical issues")[0]);
    fireEvent.change(scheduleSelect, { target: { value: "weekly" } });
    expect(platformSelect.value).toBe("gitlab");
    expect(scheduleSelect.value).toBe("weekly");
  });

  it("shows empty saved URLs message when none exist", () => {
    mockGetScannedUrls.mockReturnValueOnce([]);
    render(<CICDGenerator />);
    screen.queryAllByText("×").forEach(btn => fireEvent.click(btn));
    expect(screen.getByText("Add URLs to include in the scan pipeline")).toBeInTheDocument();
  });

  it("omits gitlab artifacts block when uploads are disabled", () => {
    const { container } = render(<CICDGenerator />);
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "gitlab" } });
    const uploadCheckbox = screen.getAllByLabelText("Upload results as artifact")[0];
    fireEvent.click(uploadCheckbox); // toggle off
    expect(container.textContent ?? "").not.toContain("artifacts:");
    expect(container.textContent ?? "").not.toContain("when: always");
  });

  it("adds harness failure strategy when critical failures are ignored", async () => {
    vi.useRealTimers();
    render(<CICDGenerator />);
    const getConfigText = () =>
      document.querySelector("div[style*='monospace']")?.textContent ?? "";
    const platformSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(platformSelect, { target: { value: "harness" } });
    });
    expect(platformSelect.value).toBe("harness");
    await waitFor(() => expect(getConfigText()).toContain("pipeline:"));
    const criticalCheckbox = screen.getAllByLabelText("Fail build on critical issues")[0];
    await act(async () => {
      fireEvent.click(criticalCheckbox); // toggle off
    });
    expect(criticalCheckbox).not.toBeChecked();
    // harness config should render the failureStrategies block when critical failures are ignored
    await waitFor(() => expect(getConfigText()).toContain("failureStrategies"));
    expect(getConfigText()).toContain("type: Ignore");
    expect(getConfigText()).toContain("for url in $URLS"); // loop body (line 185)
  });

  it("omits harness upload step when artifacts are disabled", async () => {
    vi.useRealTimers();
    render(<CICDGenerator />);
    const getConfigText = () =>
      document.querySelector("div[style*='monospace']")?.textContent ?? "";
    const platformSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(platformSelect, { target: { value: "harness" } });
    });
    expect(platformSelect.value).toBe("harness");
    await waitFor(() => expect(getConfigText()).toContain("pipeline:"));
    // With uploads enabled, harness config includes upload step
    await waitFor(() => expect(getConfigText()).toContain("sourcePath: results/"));

    const uploadCheckbox = screen.getAllByLabelText("Upload results as artifact")[0];
    await act(async () => {
      fireEvent.click(uploadCheckbox); // disable
    });
    expect(uploadCheckbox).not.toBeChecked();
    expect(getConfigText()).not.toContain("S3Upload");
    // Ensure the harness upload step string is absent when uploads disabled
    expect(getConfigText()).not.toContain("sourcePath: results/");
  });

  it("updates platform and schedule selectors", async () => {
    render(<CICDGenerator />);

    const platformSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    const scheduleSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;

    // Change platform to GitHub and schedule to manual to hit onChange handlers (lines 293-309)
    fireEvent.change(platformSelect, { target: { value: "github" } });
    fireEvent.change(scheduleSelect, { target: { value: "manual" } });
    expect(platformSelect.value).toBe("github");
    expect(scheduleSelect.value).toBe("manual");

    // Config should now include workflow_dispatch trigger
    const configText = document.querySelector("div[style*='monospace']")?.textContent ?? "";
    expect(configText).toContain("workflow_dispatch");
  });

  it("does not add duplicate or empty URLs", () => {
    const { container } = render(<CICDGenerator />);
    const getUrlCount = () => {
      const match = (container.textContent ?? "").match(/URLS="([^"]*)"/);
      const urls = match?.[1]?.trim();
      return urls ? urls.split(" ").filter(Boolean).length : 0;
    };
    const initialUrls = getUrlCount();

    // Empty input, click first Add button
    fireEvent.click(screen.getAllByRole("button", { name: "Add" })[0]);
    expect(getUrlCount()).toBe(initialUrls);

    // Duplicate URL, click Add
    const urlInputs = screen.getAllByPlaceholderText("https://example.com");
    fireEvent.change(urlInputs[0], {
      target: { value: "https://site-a.com" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Add" })[0]);
    expect(getUrlCount()).toBe(initialUrls);
  });
});
