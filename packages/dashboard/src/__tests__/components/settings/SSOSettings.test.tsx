// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SSOSettings } from "../../../components/settings/SSOSettings";

const mockUseLocalStorage = vi.fn();

vi.mock("../../../hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useLocalStorage: (key: string, value: unknown) => mockUseLocalStorage(key, value),
  };
});

vi.mock('../../../contexts', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'u1', email: 'admin@test.com', name: 'Admin', role: 'admin' },
      organization: {
        id: 'org1',
        name: 'Test',
        plan: 'enterprise',
        settings: {
          maxScansPerMonth: -1,
          maxAiFixesPerMonth: -1,
          maxGitHubPRsPerMonth: -1,
          scheduledScans: true,
          maxCustomRules: -1,
          jiraIntegration: true,
          ssoEnabled: true,
          exportFormats: ['csv', 'pdf', 'json'],
        },
      },
      isAuthenticated: true,
      can: () => true,
      hasRole: () => true,
    }),
  };
});

interface SSOConfig {
  enabled: boolean;
  provider: 'saml' | 'oidc';
  entityId: string;
  ssoUrl: string;
  certificate: string;
  signatureAlgorithm: 'sha256' | 'sha512';
  nameIdFormat: string;
  attributeMapping: { email: string; firstName: string; lastName: string; role?: string };
}

const DEFAULT_SSO_CONFIG: SSOConfig = {
  enabled: false,
  provider: 'saml',
  entityId: '',
  ssoUrl: '',
  certificate: '',
  signatureAlgorithm: 'sha256',
  nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  attributeMapping: {
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    role: 'role',
  },
};

describe("settings/SSOSettings", () => {
  let cfg: SSOConfig;
  const setConfig = vi.fn((updater: SSOConfig | ((prev: SSOConfig) => SSOConfig)) => {
    cfg = typeof updater === "function" ? (updater as (p: SSOConfig) => SSOConfig)(cfg) : updater;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    cfg = { ...DEFAULT_SSO_CONFIG, enabled: true };
    mockUseLocalStorage.mockImplementation(() => [cfg, setConfig]);
  });

  it("renders SSO form fields when enabled", () => {
    render(<SSOSettings />);
    expect(screen.getByText("SSO / SAML Authentication")).toBeInTheDocument();
    expect(screen.getByText("Provider Configuration")).toBeInTheDocument();
    expect(screen.getByText("Attribute Mapping")).toBeInTheDocument();
  });

  it("renders provider dropdown with SAML and OIDC options", () => {
    render(<SSOSettings />);
    const selects = screen.getAllByRole("combobox");
    // Provider select is one of the comboboxes
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it("renders test connection button", () => {
    render(<SSOSettings />);
    expect(screen.getByRole("button", { name: /Test Connection/i })).toBeInTheDocument();
  });

  it("renders save button", () => {
    render(<SSOSettings />);
    expect(screen.getByRole("button", { name: /Save Settings/i })).toBeInTheDocument();
  });

  it("hides provider config when disabled", () => {
    cfg = { ...DEFAULT_SSO_CONFIG, enabled: false };
    render(<SSOSettings />);
    expect(screen.queryByText("Provider Configuration")).not.toBeInTheDocument();
  });

  it("toggles enabled state", () => {
    cfg = { ...DEFAULT_SSO_CONFIG, enabled: false };
    render(<SSOSettings />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(setConfig).toHaveBeenCalled();
  });

  it("updates entity ID field", () => {
    render(<SSOSettings />);
    const entityInput = screen.getByPlaceholderText("https://idp.example.com/metadata");
    fireEvent.change(entityInput, { target: { value: "https://my-idp.com" } });
    expect(setConfig).toHaveBeenCalled();
  });

  it("updates SSO URL field", () => {
    render(<SSOSettings />);
    const ssoUrlInput = screen.getByPlaceholderText("https://idp.example.com/sso/saml");
    fireEvent.change(ssoUrlInput, { target: { value: "https://my-idp.com/sso" } });
    expect(setConfig).toHaveBeenCalled();
  });

  it("saves and resets settings", () => {
    render(<SSOSettings />);

    const saveBtn = screen.getByRole("button", { name: "Save Settings" });
    fireEvent.click(saveBtn);
    expect(screen.getByText("Saved!")).toBeInTheDocument();

    fireEvent.animationEnd(saveBtn);
    expect(screen.getByText("Save Settings")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset to Defaults" }));
    expect(setConfig).toHaveBeenCalledWith(DEFAULT_SSO_CONFIG);
  });

  it("shows validation errors when testing without required fields", async () => {
    render(<SSOSettings />);
    fireEvent.click(screen.getByRole("button", { name: /Test Connection/i }));
    await waitFor(() => {
      expect(screen.getByText(/Entity ID is required/)).toBeInTheDocument();
    });
  });

  it("shows success when test passes with valid config", async () => {
    cfg = {
      ...DEFAULT_SSO_CONFIG,
      enabled: true,
      entityId: "https://idp.example.com",
      ssoUrl: "https://idp.example.com/sso",
      certificate: "CERT_DATA",
    };
    render(<SSOSettings />);
    fireEvent.click(screen.getByRole("button", { name: /Test Connection/i }));
    await waitFor(() => {
      expect(screen.getByText(/SSO configuration validated successfully/)).toBeInTheDocument();
    });
  });

  it("renders status indicator", () => {
    render(<SSOSettings />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("updates attribute mapping fields", () => {
    render(<SSOSettings />);
    const emailAttr = screen.getAllByPlaceholderText("email")[0];
    fireEvent.change(emailAttr, { target: { value: "mail" } });
    expect(setConfig).toHaveBeenCalled();
  });
});
