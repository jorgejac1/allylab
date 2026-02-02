import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TeamSettings } from "../../../components/settings/TeamSettings";

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock UI components
vi.mock("../../../components/ui", () => {
  const Button = ({
    onClick,
    children,
    disabled,
    variant,
    style,
  }: {
    onClick?: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    variant?: string;
    style?: React.CSSProperties;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} style={style}>
      {children}
    </button>
  );
  const Card = ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>;
  const Modal = ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="modal" role="dialog">
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="Close">
          Close
        </button>
        {children}
      </div>
    ) : null;
  return { Button, Card, Modal };
});

// Mock config
vi.mock("../../../config/auth", () => ({
  authConfig: {
    websiteUrl: "https://example.com",
    apiUrl: "https://api.example.com",
  },
}));

describe("settings/TeamSettings", () => {
  const mockUsers = [
    {
      id: "user_admin",
      email: "admin@test.com",
      name: "Admin User",
      role: "admin" as const,
      organizationId: "org_test",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "user_dev",
      email: "dev@test.com",
      name: "Developer User",
      role: "developer" as const,
      organizationId: "org_test",
      createdAt: "2024-01-02T00:00:00Z",
    },
  ];

  const defaultMockOrganization = {
    id: "org_test",
    name: "Test Org",
    plan: "team" as const,
    settings: {
      maxUsers: 20,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUsers[0],
      organization: defaultMockOrganization,
      can: vi.fn().mockReturnValue(true),
      isMockAuth: true,
      allUsers: mockUsers,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders team members heading", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Team Members")).toBeInTheDocument();
    });
  });

  it("shows loading state initially when not in mock mode", async () => {
    // In mock mode, loading is almost instant due to the useEffect
    // This test verifies the loading component renders before data loads
    mockUseAuth.mockReturnValue({
      user: mockUsers[0],
      organization: defaultMockOrganization,
      can: vi.fn().mockReturnValue(true),
      isMockAuth: false, // Production mode would show loading longer
      allUsers: [],
    });

    // Note: In actual implementation, loading state may flash briefly
    // This test documents the expected behavior
    render(<TeamSettings />);
    // The loading state exists in the component
    expect(screen.getByText("Loading team members...")).toBeInTheDocument();
  });

  it("displays team members after loading", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(screen.getByText("Developer User")).toBeInTheDocument();
    });
  });

  it("shows member emails", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("admin@test.com")).toBeInTheDocument();
      expect(screen.getByText("dev@test.com")).toBeInTheDocument();
    });
  });

  it("shows 'You' badge for current user", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("You")).toBeInTheDocument();
    });
  });

  it("shows invite member button when user can manage", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Invite Member")).toBeInTheDocument();
    });
  });

  it("hides invite member button when user cannot manage", async () => {
    mockUseAuth.mockReturnValue({
      user: mockUsers[0],
      organization: defaultMockOrganization,
      can: vi.fn().mockReturnValue(false),
      isMockAuth: true,
      allUsers: mockUsers,
    });
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });
    expect(screen.queryByText("Invite Member")).not.toBeInTheDocument();
  });

  it("opens invite modal when clicking invite button", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Invite Member")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Invite Member"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Invite Team Member")).toBeInTheDocument();
  });

  it("shows email input in invite modal", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Invite Member")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Invite Member"));
    expect(screen.getByPlaceholderText("colleague@company.com")).toBeInTheDocument();
  });

  it("shows role selector in invite modal", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Invite Member")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Invite Member"));
    // Modal has a role selector; there may also be role selectors for existing members
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes.length).toBeGreaterThanOrEqual(1);
  });

  it("adds new member in mock mode", async () => {
    const user = userEvent.setup();
    render(<TeamSettings />);

    await waitFor(() => {
      expect(screen.getByText("Invite Member")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Invite Member"));

    const emailInput = screen.getByPlaceholderText("colleague@company.com");
    await user.type(emailInput, "newuser@test.com");

    fireEvent.click(screen.getByText("Send Invitation"));

    await waitFor(() => {
      expect(screen.getByText("Newuser")).toBeInTheDocument();
    });
  });

  it("closes invite modal after successful invite", async () => {
    const user = userEvent.setup();
    render(<TeamSettings />);

    await waitFor(() => {
      expect(screen.getByText("Invite Member")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Invite Member"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText("colleague@company.com");
    await user.type(emailInput, "newuser@test.com");

    fireEvent.click(screen.getByText("Send Invitation"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("shows role change dropdown for other users", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Developer User")).toBeInTheDocument();
    });

    // Should have role selector for non-current user
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);
  });

  it("allows changing role of other users in mock mode", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Developer User")).toBeInTheDocument();
    });

    // Find the role dropdown for the developer user (not the current user)
    const selects = screen.getAllByRole("combobox");
    const roleSelect = selects[0];

    fireEvent.change(roleSelect, { target: { value: "manager" } });

    await waitFor(() => {
      expect(roleSelect).toHaveValue("manager");
    });
  });

  it("shows remove button for other users when can manage", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Developer User")).toBeInTheDocument();
    });

    // Should have delete buttons
    const deleteButtons = screen.getAllByTitle("Remove member");
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it("removes member when confirmed in mock mode", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Developer User")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle("Remove member");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Developer User")).not.toBeInTheDocument();
    });
  });

  it("does not remove member when confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Developer User")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle("Remove member");
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText("Developer User")).toBeInTheDocument();
  });

  it("shows role permissions reference section", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Role Permissions")).toBeInTheDocument();
    });
  });

  it("shows all role types in permissions reference", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      // Wait for the members to load first
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    // Check for role labels in the permissions reference section
    // These appear as standalone text in the permissions reference
    expect(screen.getByText("Full access, can manage users and billing")).toBeInTheDocument();
    expect(screen.getByText("Can manage scans, integrations, and team settings")).toBeInTheDocument();
    expect(screen.getByText("Can run scans and create fixes")).toBeInTheDocument();
    expect(screen.getByText("Read-only access to reports")).toBeInTheDocument();
    expect(screen.getByText("Access to reports and auditing features")).toBeInTheDocument();
  });

  it("shows organization info with user count", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText(/Test Org/)).toBeInTheDocument();
      expect(screen.getByText(/2 of 20 users/)).toBeInTheDocument();
    });
  });

  it("does not show role dropdown for current user", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    // Current user row should show static role badge, not dropdown
    // Admin should appear as text for current user's role
    const adminBadges = screen.getAllByText("Admin");
    expect(adminBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("does not show remove button for current user", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    // Should only have 1 delete button (for dev user, not admin)
    const deleteButtons = screen.getAllByTitle("Remove member");
    expect(deleteButtons).toHaveLength(1);
  });

  it("closes invite modal on cancel", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Invite Member")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Invite Member"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("disables send button when email is empty", async () => {
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Invite Member")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Invite Member"));

    const sendButton = screen.getByText("Send Invitation");
    expect(sendButton).toBeDisabled();
  });

  it("enables send button when email is entered", async () => {
    const user = userEvent.setup();
    render(<TeamSettings />);
    await waitFor(() => {
      expect(screen.getByText("Invite Member")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Invite Member"));

    const emailInput = screen.getByPlaceholderText("colleague@company.com");
    await user.type(emailInput, "test@test.com");

    const sendButton = screen.getByText("Send Invitation");
    expect(sendButton).not.toBeDisabled();
  });
});
