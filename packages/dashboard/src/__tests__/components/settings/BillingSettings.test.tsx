import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BillingSettings } from "../../../components/settings/BillingSettings";

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
  return { Button, Card };
});

// Mock config
vi.mock("../../../config/auth", () => ({
  authConfig: {
    websiteUrl: "https://example.com",
    apiUrl: "https://api.example.com",
  },
}));

describe("settings/BillingSettings", () => {
  const defaultMockOrganization = {
    id: "org_test",
    name: "Test Org",
    plan: "team" as const,
    settings: {
      maxScansPerMonth: 500,
      maxAiFixesPerMonth: 100,
      maxGitHubPRsPerMonth: 50,
      maxUsers: 20,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseAuth.mockReturnValue({
      organization: defaultMockOrganization,
      can: vi.fn().mockReturnValue(true),
      isMockAuth: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders current plan information", () => {
    render(<BillingSettings />);
    expect(screen.getByText("Current Plan")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("$149/month")).toBeInTheDocument();
  });

  it("shows demo mode banner when in mock auth", () => {
    render(<BillingSettings />);
    expect(screen.getByText(/Demo Mode:/)).toBeInTheDocument();
    expect(screen.getByText(/Billing actions are simulated/)).toBeInTheDocument();
  });

  it("does not show demo mode banner in production", () => {
    mockUseAuth.mockReturnValue({
      organization: defaultMockOrganization,
      can: vi.fn().mockReturnValue(true),
      isMockAuth: false,
    });
    render(<BillingSettings />);
    expect(screen.queryByText(/Demo Mode:/)).not.toBeInTheDocument();
  });

  it("shows trial banner for paid plans", () => {
    render(<BillingSettings />);
    expect(screen.getByText(/Your trial ends on/)).toBeInTheDocument();
  });

  it("does not show trial banner for free plan", () => {
    mockUseAuth.mockReturnValue({
      organization: { ...defaultMockOrganization, plan: "free" },
      can: vi.fn().mockReturnValue(true),
      isMockAuth: true,
    });
    render(<BillingSettings />);
    expect(screen.queryByText(/Your trial ends on/)).not.toBeInTheDocument();
  });

  it("shows upgrade options for free plan", () => {
    mockUseAuth.mockReturnValue({
      organization: { ...defaultMockOrganization, plan: "free" },
      can: vi.fn().mockReturnValue(true),
      isMockAuth: true,
    });
    render(<BillingSettings />);
    expect(screen.getByText("Upgrade Your Plan")).toBeInTheDocument();
    expect(screen.getByText("Upgrade to Pro")).toBeInTheDocument();
    expect(screen.getByText("Upgrade to Team")).toBeInTheDocument();
  });

  it("does not show upgrade options for paid plans", () => {
    render(<BillingSettings />);
    expect(screen.queryByText("Upgrade Your Plan")).not.toBeInTheDocument();
  });

  it("shows downgrade button in mock mode for paid plans", () => {
    render(<BillingSettings />);
    expect(screen.getByText("Downgrade to Free (Demo)")).toBeInTheDocument();
  });

  it("handles upgrade to Pro in mock mode", async () => {
    mockUseAuth.mockReturnValue({
      organization: { ...defaultMockOrganization, plan: "free" },
      can: vi.fn().mockReturnValue(true),
      isMockAuth: true,
    });
    render(<BillingSettings />);

    fireEvent.click(screen.getByText("Upgrade to Pro"));

    await waitFor(() => {
      expect(screen.getByText(/Successfully upgraded to Pro/)).toBeInTheDocument();
    });

    // Plan should now show Pro
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("handles upgrade to Team in mock mode", async () => {
    mockUseAuth.mockReturnValue({
      organization: { ...defaultMockOrganization, plan: "free" },
      can: vi.fn().mockReturnValue(true),
      isMockAuth: true,
    });
    render(<BillingSettings />);

    fireEvent.click(screen.getByText("Upgrade to Team"));

    await waitFor(() => {
      expect(screen.getByText(/Successfully upgraded to Team/)).toBeInTheDocument();
    });
  });

  it("handles downgrade in mock mode", async () => {
    render(<BillingSettings />);

    fireEvent.click(screen.getByText("Downgrade to Free (Demo)"));

    await waitFor(() => {
      expect(screen.getByText(/Successfully downgraded to Free plan/)).toBeInTheDocument();
    });
  });

  it("shows manage billing button for paid plans", () => {
    render(<BillingSettings />);
    expect(screen.getByText("Manage Billing")).toBeInTheDocument();
  });

  it("does not show manage billing button for free plan", () => {
    mockUseAuth.mockReturnValue({
      organization: { ...defaultMockOrganization, plan: "free" },
      can: vi.fn().mockReturnValue(true),
      isMockAuth: true,
    });
    render(<BillingSettings />);
    expect(screen.queryByText("Manage Billing")).not.toBeInTheDocument();
  });

  it("shows success message when clicking manage billing in mock mode", async () => {
    render(<BillingSettings />);

    fireEvent.click(screen.getByText("Manage Billing"));

    await waitFor(() => {
      expect(screen.getByText(/In production, this opens the Stripe billing portal/)).toBeInTheDocument();
    });
  });

  it("shows usage statistics", () => {
    render(<BillingSettings />);
    expect(screen.getByText("Usage This Month")).toBeInTheDocument();
    expect(screen.getByText("Scans")).toBeInTheDocument();
    expect(screen.getByText("AI Fixes")).toBeInTheDocument();
    expect(screen.getByText("GitHub PRs")).toBeInTheDocument();
  });

  it("shows plan features", () => {
    render(<BillingSettings />);
    // Team plan features
    expect(screen.getByText("500 scans per month")).toBeInTheDocument();
    expect(screen.getByText("100 pages per scan")).toBeInTheDocument();
    expect(screen.getByText("Custom rules")).toBeInTheDocument();
  });

  it("hides downgrade button when user cannot manage billing", () => {
    mockUseAuth.mockReturnValue({
      organization: defaultMockOrganization,
      can: vi.fn().mockReturnValue(false),
      isMockAuth: true,
    });
    render(<BillingSettings />);
    expect(screen.queryByText("Downgrade to Free (Demo)")).not.toBeInTheDocument();
  });

  it("hides manage billing button when user cannot manage billing", () => {
    mockUseAuth.mockReturnValue({
      organization: defaultMockOrganization,
      can: vi.fn().mockReturnValue(false),
      isMockAuth: true,
    });
    render(<BillingSettings />);
    expect(screen.queryByText("Manage Billing")).not.toBeInTheDocument();
  });

  it("shows compare all plans link", () => {
    render(<BillingSettings />);
    expect(screen.getByText(/Compare all plans/)).toBeInTheDocument();
  });

  it("shows active badge for paid plans", () => {
    render(<BillingSettings />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("does not show active badge for free plan", () => {
    mockUseAuth.mockReturnValue({
      organization: { ...defaultMockOrganization, plan: "free" },
      can: vi.fn().mockReturnValue(true),
      isMockAuth: true,
    });
    render(<BillingSettings />);
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("shows enterprise plan features", () => {
    mockUseAuth.mockReturnValue({
      organization: { ...defaultMockOrganization, plan: "enterprise" },
      can: vi.fn().mockReturnValue(true),
      isMockAuth: true,
    });
    render(<BillingSettings />);
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
    expect(screen.getByText("Unlimited scans")).toBeInTheDocument();
    expect(screen.getByText("SSO / SAML")).toBeInTheDocument();
  });
});
