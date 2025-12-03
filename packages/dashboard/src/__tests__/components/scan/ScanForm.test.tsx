// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ScanForm } from "../../../components/scan/ScanForm";

vi.mock("../../../components/scan/CustomRulesIndicator", () => ({
  CustomRulesIndicator: () => <div data-testid="rules-indicator">rules</div>,
}));

describe("components/scan/ScanForm", () => {
  it("submits trimmed URL, adds protocol, and respects isScanning", () => {
    const onScan = vi.fn();
    render(<ScanForm onScan={onScan} isScanning={false} />);

    const input = screen.getAllByPlaceholderText(/Enter URL to scan/)[0];
    fireEvent.change(input, { target: { value: "allylab.com" } });
    fireEvent.click(screen.getByRole("button", { name: "🔍 Scan Page" }));
    expect(onScan).toHaveBeenCalledWith("https://allylab.com", {
      standard: "wcag21aa",
      viewport: "desktop",
    });
  });

  it("ignores blank submissions and disables controls when scanning", () => {
    const onScan = vi.fn();
    render(<ScanForm onScan={onScan} isScanning={true} initialUrl="   " />);

    const button = screen.getByRole("button", { name: "⏳ Scanning..." });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onScan).not.toHaveBeenCalled();
  });

  it("changes viewport and standard selections and submits on Enter", () => {
    const onScan = vi.fn();
    const { container } = render(<ScanForm onScan={onScan} isScanning={false} />);

    const viewportButtons = within(container)
      .getAllByRole("button")
      .filter((b) => b.textContent?.includes("Tablet"));
    fireEvent.click(viewportButtons[0]);
    const standardSelect = within(container).getByRole("combobox");
    fireEvent.change(standardSelect, { target: { value: "wcag22aa" } });

    const input = within(container).getByPlaceholderText(/Enter URL to scan/);
    fireEvent.change(input, { target: { value: "http://allylab.com" } });
    const scanButton = within(container).getByRole("button", { name: /Scan Page/ });
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
      .find((btn) => btn.textContent?.includes("Mobile")) as HTMLButtonElement;
    fireEvent.click(mobileBtn);

    expect(screen.getByText(/375×667 \(2x scale\)/)).toBeInTheDocument();
  });
});
