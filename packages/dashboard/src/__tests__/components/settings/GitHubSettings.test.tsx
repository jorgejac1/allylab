import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GitHubSettings } from "../../../components/settings/GitHubSettings";

const mockUseGitHub = vi.fn();

vi.mock("../../../hooks/useGitHub", () => ({
  useGitHub: () => mockUseGitHub(),
}));
vi.mock("../../../components/ui", () => {
  const Button = ({
    onClick,
    children,
  }: { onClick?: () => void; children: React.ReactNode }) => (
    <button onClick={onClick}>
      {children}
    </button>
  );
  const Card = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return { Button, Card };
});

describe("settings/GitHubSettings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseGitHub.mockReturnValue({
      connection: { connected: false },
      isLoading: false,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading state", () => {
    mockUseGitHub.mockReturnValue({ isLoading: true, connection: {}, error: null, connect: vi.fn(), disconnect: vi.fn() });
    render(<GitHubSettings />);
    expect(screen.getByText(/Loading GitHub connection/)).toBeInTheDocument();
  });

  it("connects with token and toggles input", async () => {
    const connect = vi.fn().mockResolvedValue(true);
    mockUseGitHub.mockReturnValue({ connection: { connected: false }, isLoading: false, error: "bad", connect, disconnect: vi.fn() });
    render(<GitHubSettings />);

    expect(screen.getByText("bad")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "🔗 Connect GitHub" })[0]);
    const input = screen.getByPlaceholderText("ghp_xxxxxxxxxxxxxxxxxxxx");
    fireEvent.change(input, { target: { value: " token " } });
    fireEvent.click(screen.getAllByRole("button", { name: "Connect" })[0]);
    await waitFor(() => expect(connect).toHaveBeenCalledWith("token"));
    expect(screen.queryByPlaceholderText("ghp_xxxxxxxxxxxxxxxxxxxx")).not.toBeInTheDocument();
  });

  it("shows connected state and handles disconnect confirmation", async () => {
    const disconnect = vi.fn();
    mockUseGitHub.mockReturnValue({
      connection: {
        connected: true,
        user: { login: "octo", avatar_url: "url" },
        repos: [{ id: 1 }, { id: 2 }],
      },
      isLoading: false,
      error: null,
      connect: vi.fn(),
      disconnect,
    });
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    render(<GitHubSettings />);

    expect(screen.getByText("✓ Connected")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Disconnect GitHub" })[0]);
    expect(disconnect).toHaveBeenCalled();
  });

  it("returns early when token is empty or whitespace", async () => {
    const connect = vi.fn().mockResolvedValue(true);
    mockUseGitHub.mockReturnValue({ connection: { connected: false }, isLoading: false, error: null, connect, disconnect: vi.fn() });
    const user = userEvent.setup();
    render(<GitHubSettings />);

    await user.click(screen.getAllByRole("button", { name: "🔗 Connect GitHub" })[0]);
    const input = screen.getByPlaceholderText("ghp_xxxxxxxxxxxxxxxxxxxx");

    // Test 1: Empty token (input starts empty)
    let connectBtn = screen.getAllByRole("button", { name: "Connect" })[0] as HTMLButtonElement;
    connectBtn.click();

    await waitFor(() => expect(connect).not.toHaveBeenCalled());
    expect(screen.queryByText("Connecting...")).not.toBeInTheDocument();

    // Test 2: Whitespace-only token
    await user.type(input, "   ");
    connectBtn = screen.getAllByRole("button", { name: "Connect" })[0] as HTMLButtonElement;

    connectBtn.click();

    // Verify early return again
    await waitFor(() => expect(connect).not.toHaveBeenCalled());
    expect(screen.queryByText("Connecting...")).not.toBeInTheDocument();
  });

  it("hides token input when cancel is clicked", () => {
    mockUseGitHub.mockReturnValue({ connection: { connected: false }, isLoading: false, error: null, connect: vi.fn(), disconnect: vi.fn() });
    render(<GitHubSettings />);

    // Show token input
    fireEvent.click(screen.getAllByRole("button", { name: "🔗 Connect GitHub" })[0]);
    expect(screen.getByPlaceholderText("ghp_xxxxxxxxxxxxxxxxxxxx")).toBeInTheDocument();

    // Click cancel
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]);
    expect(screen.queryByPlaceholderText("ghp_xxxxxxxxxxxxxxxxxxxx")).not.toBeInTheDocument();
  });

  it("keeps token input visible when connect fails", async () => {
    const connect = vi.fn().mockResolvedValue(false);
    mockUseGitHub.mockReturnValue({ connection: { connected: false }, isLoading: false, error: null, connect, disconnect: vi.fn() });
    render(<GitHubSettings />);

    fireEvent.click(screen.getAllByRole("button", { name: "🔗 Connect GitHub" })[0]);
    const input = screen.getByPlaceholderText("ghp_xxxxxxxxxxxxxxxxxxxx");
    fireEvent.change(input, { target: { value: "token" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Connect" })[0]);

    await waitFor(() => expect(connect).toHaveBeenCalledWith("token"));
    expect(screen.getByPlaceholderText("ghp_xxxxxxxxxxxxxxxxxxxx")).toBeInTheDocument();
  });

  it("does not disconnect when confirmation is cancelled", async () => {
    const disconnect = vi.fn();
    mockUseGitHub.mockReturnValue({
      connection: { connected: true, user: { login: "octo", avatar_url: "url" } },
      isLoading: false,
      error: null,
      connect: vi.fn(),
      disconnect,
    });
    vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    render(<GitHubSettings />);

    fireEvent.click(screen.getAllByRole("button", { name: "Disconnect GitHub" })[0]);
    expect(disconnect).not.toHaveBeenCalled();
  });
});
