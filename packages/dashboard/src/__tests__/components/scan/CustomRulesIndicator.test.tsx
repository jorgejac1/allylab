// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CustomRulesIndicator } from "../../../components/scan/CustomRulesIndicator";

const fetchMock = vi.fn();
vi.mock("../../../utils/api", () => ({
  getApiBase: () => "http://api",
}));

describe("components/scan/CustomRulesIndicator", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it("renders nothing when no status or total is zero", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: { total: 0, enabled: 0 } }),
    });
    const { container } = render(<CustomRulesIndicator />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it("shows enabled and total counts when available", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: { total: 3, enabled: 2 } }),
    });
    render(<CustomRulesIndicator />);
    await waitFor(() => expect(screen.getByText(/2 custom rule/)).toBeInTheDocument());
    expect(screen.getByText("(3 total)")).toBeInTheDocument();
  });

  it("does not render when response is ok but success is false", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: false }),
    });
    const { container } = render(<CustomRulesIndicator />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it("does not render when response is not ok", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });
    const { container } = render(<CustomRulesIndicator />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it("uses disabled styles when no rules are enabled", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: { total: 2, enabled: 0 } }),
    });
    render(<CustomRulesIndicator />);
    const pill = await screen.findByText(/0 custom rules enabled/);
    const wrapper = pill.parentElement as HTMLElement;
    expect(wrapper.style.background).toBe("rgb(241, 245, 249)");
    expect(wrapper.style.border).toBe("1px solid rgb(226, 232, 240)");
    expect(wrapper.style.color).toBe("rgb(100, 116, 139)");
    expect(pill.textContent?.trim()).toMatch(/0 custom rules enabled/);
  });

  it("pluralizes custom rules label correctly", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: { total: 5, enabled: 1 } }),
    });
    render(<CustomRulesIndicator />);
    expect(await screen.findByText(/1 custom rule enabled/)).toBeInTheDocument();
  });
});
