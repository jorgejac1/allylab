// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ScanForm } from "../../../components/scan/ScanForm";

vi.mock("../../../components/scan/CustomRulesIndicator", () => ({
  CustomRulesIndicator: () => <div data-testid="rules-indicator">rules</div>,
}));

vi.mock('../../../contexts', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'u1', email: 'admin@test.com', name: 'Admin', role: 'admin' },
      organization: { id: 'org1', name: 'Test', plan: 'enterprise', settings: { maxScansPerMonth: -1, maxAiFixesPerMonth: -1, maxGitHubPRsPerMonth: -1, scheduledScans: true, maxCustomRules: -1, jiraIntegration: true, exportFormats: ['csv', 'pdf', 'json'] } },
      isAuthenticated: true,
      can: () => true,
      hasRole: () => true,
    }),
  };
});

describe("components/scan/ScanForm", () => {
  it("submits trimmed URL, adds protocol, and respects isScanning", () => {
    const onScan = vi.fn();
    render(<ScanForm onScan={onScan} isScanning={false} />);

    const input = screen.getAllByPlaceholderText(/Enter URL to scan/)[0];
    fireEvent.change(input, { target: { value: "allylab.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Scan/ }));
    expect(onScan).toHaveBeenCalledWith("https://allylab.com", {
      standard: "wcag21aa",
      viewport: "desktop",
    });
  });

  it("ignores blank submissions and disables controls when scanning", () => {
    const onScan = vi.fn();
    render(<ScanForm onScan={onScan} isScanning={true} initialUrl="   " />);

    const button = screen.getByRole("button", { name: /Scanning\.\.\./ });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onScan).not.toHaveBeenCalled();
  });

  it("changes viewport and standard selections and submits on Enter", () => {
    const onScan = vi.fn();
    const { container } = render(<ScanForm onScan={onScan} isScanning={false} />);

    const tabletBtn = within(container)
      .getAllByRole("button")
      .find((b) => b.getAttribute("title")?.includes("Tablet")) as HTMLButtonElement;
    fireEvent.click(tabletBtn);
    const standardSelect = within(container).getAllByRole("combobox")[0];
    fireEvent.change(standardSelect, { target: { value: "wcag22aa" } });

    const input = within(container).getByPlaceholderText(/Enter URL to scan/);
    fireEvent.change(input, { target: { value: "http://allylab.com" } });
    const scanButton = within(container).getByRole("button", { name: /Scan/ });
    fireEvent.click(scanButton);

    expect(onScan).toHaveBeenCalledWith("http://allylab.com", {
      standard: "wcag22aa",
      viewport: "tablet",
    });
  });

  it("returns early when URL is blank even when not scanning", () => {
    const onScan = vi.fn();
    render(<ScanForm onScan={onScan} isScanning={false} initialUrl="   " />);

    const inputs = screen.getAllByPlaceholderText(/Enter URL to scan/);
    const target =
      (inputs.find((el) => (el as HTMLInputElement).value.trim() === "") as HTMLInputElement) ||
      (inputs[inputs.length - 1] as HTMLInputElement);
    fireEvent.keyDown(target, { key: "Enter" });
    expect(onScan).not.toHaveBeenCalled();
  });

  it("shows mobile viewport dimensions text", () => {
    const onScan = vi.fn();
    const { container } = render(<ScanForm onScan={onScan} isScanning={false} />);

    const mobileBtn = within(container)
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("title")?.includes("Mobile")) as HTMLButtonElement;
    fireEvent.click(mobileBtn);

    expect(screen.getByText(/375×667/)).toBeInTheDocument();
  });

  it("should show TV viewport options", () => {
    const onScan = vi.fn();
    const { container } = render(<ScanForm onScan={onScan} isScanning={false} />);

    const tvHdBtn = within(container)
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("title")?.includes("TV HD"));
    const tv4kBtn = within(container)
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("title")?.includes("TV 4K"));

    expect(tvHdBtn).toBeInTheDocument();
    expect(tv4kBtn).toBeInTheDocument();
  });

  it("shows TV HD viewport dimensions when selected", () => {
    const onScan = vi.fn();
    const { container } = render(<ScanForm onScan={onScan} isScanning={false} />);

    const tvHdBtn = within(container)
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("title")?.includes("TV HD")) as HTMLButtonElement;
    fireEvent.click(tvHdBtn);

    expect(screen.getByText(/1920×1080/)).toBeInTheDocument();
  });

  it("shows TV 4K viewport dimensions when selected", () => {
    const onScan = vi.fn();
    const { container } = render(<ScanForm onScan={onScan} isScanning={false} />);

    const tv4kBtn = within(container)
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("title")?.includes("TV 4K")) as HTMLButtonElement;
    fireEvent.click(tv4kBtn);

    expect(screen.getByText(/3840×2160/)).toBeInTheDocument();
  });

  it("submits with TV HD viewport when selected", () => {
    const onScan = vi.fn();
    const { container } = render(<ScanForm onScan={onScan} isScanning={false} />);

    const tvHdBtn = within(container)
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("title")?.includes("TV HD")) as HTMLButtonElement;
    fireEvent.click(tvHdBtn);

    const input = within(container).getByPlaceholderText(/Enter URL to scan/);
    fireEvent.change(input, { target: { value: "https://example.com" } });
    const scanButton = within(container).getByRole("button", { name: /Scan/ });
    fireEvent.click(scanButton);

    expect(onScan).toHaveBeenCalledWith("https://example.com", {
      standard: "wcag21aa",
      viewport: "tv-hd",
    });
  });
});
