import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

const makeStorage = (): Storage =>
  ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  } as unknown as Storage);

import {
  getAuthProfiles,
  getAuthProfile,
  saveAuthProfile,
  deleteAuthProfile,
  findProfileForDomain,
  profileToAuthOptions,
  toggleProfileEnabled,
  getAuthMethodLabel,
  validateAuthProfile,
  exportProfiles,
  importProfiles,
} from "../../utils/authProfiles";
import type { AuthProfile } from "../../types/auth";

const baseProfile: AuthProfile = {
  id: "auth_123",
  name: "Test Profile",
  description: "Test description",
  domains: ["example.com", "*.example.org"],
  method: "cookies",
  cookies: [{ name: "session", value: "abc123", domain: ".example.com" }],
  enabled: true,
  createdAt: "2024-01-01T00:00:00.000Z",
};

describe("utils/authProfiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const storage = makeStorage();
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    Object.defineProperty(globalThis, "window", { value: { localStorage: storage }, configurable: true });
  });

  describe("getAuthProfiles", () => {
    it("returns empty array when no data", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(null);
      expect(getAuthProfiles()).toEqual([]);
    });

    it("returns parsed profiles", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      const profiles = getAuthProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe("Test Profile");
    });

    it("returns empty array on parse error", () => {
      (window.localStorage.getItem as Mock).mockReturnValue("invalid json");
      expect(getAuthProfiles()).toEqual([]);
    });
  });

  describe("getAuthProfile", () => {
    it("returns profile by id", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      const profile = getAuthProfile("auth_123");
      expect(profile?.name).toBe("Test Profile");
    });

    it("returns undefined for non-existent id", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      expect(getAuthProfile("non-existent")).toBeUndefined();
    });
  });

  describe("saveAuthProfile", () => {
    it("creates new profile with generated id", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([]));
      const newProfile = {
        name: "New Profile",
        domains: ["test.com"],
        method: "cookies" as const,
        cookies: [],
        enabled: true,
      };
      const saved = saveAuthProfile(newProfile);
      expect(saved.id).toMatch(/^auth_/);
      expect(saved.createdAt).toBeDefined();
    });

    it("updates existing profile", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      const updated = saveAuthProfile({ ...baseProfile, name: "Updated Name" });
      expect(updated.name).toBe("Updated Name");
      expect(updated.updatedAt).toBeDefined();
    });

    it("throws when updating non-existent profile", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([]));
      expect(() => saveAuthProfile({ ...baseProfile, id: "non-existent" })).toThrow("Profile not found");
    });
  });

  describe("deleteAuthProfile", () => {
    it("removes profile by id", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      const result = deleteAuthProfile("auth_123");
      expect(result).toBe(true);
      const saved = JSON.parse((window.localStorage.setItem as Mock).mock.calls[0][1]);
      expect(saved).toHaveLength(0);
    });

    it("returns false when profile not found", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      const result = deleteAuthProfile("non-existent");
      expect(result).toBe(false);
    });
  });

  describe("findProfileForDomain", () => {
    it("finds exact domain match", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      const profile = findProfileForDomain("example.com");
      expect(profile?.name).toBe("Test Profile");
    });

    it("finds wildcard domain match", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      const profile = findProfileForDomain("sub.example.org");
      expect(profile?.name).toBe("Test Profile");
    });

    it("matches root domain for wildcard", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      const profile = findProfileForDomain("example.org");
      expect(profile?.name).toBe("Test Profile");
    });

    it("returns undefined when no match", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      expect(findProfileForDomain("other.com")).toBeUndefined();
    });

    it("only matches enabled profiles", () => {
      const disabledProfile = { ...baseProfile, enabled: false };
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([disabledProfile]));
      expect(findProfileForDomain("example.com")).toBeUndefined();
    });
  });

  describe("profileToAuthOptions", () => {
    it("converts cookies profile", () => {
      const options = profileToAuthOptions(baseProfile);
      expect(options.cookies).toEqual(baseProfile.cookies);
      expect(options.headers).toBeUndefined();
    });

    it("converts headers profile", () => {
      const headersProfile: AuthProfile = {
        ...baseProfile,
        method: "headers",
        headers: { Authorization: "Bearer token" },
      };
      const options = profileToAuthOptions(headersProfile);
      expect(options.headers).toEqual({ Authorization: "Bearer token" });
    });

    it("converts basic-auth profile", () => {
      const basicAuthProfile: AuthProfile = {
        ...baseProfile,
        method: "basic-auth",
        basicAuth: { username: "user", password: "pass" },
      };
      const options = profileToAuthOptions(basicAuthProfile);
      expect(options.basicAuth).toEqual({ username: "user", password: "pass" });
    });

    it("converts login-flow profile", () => {
      const loginFlowProfile: AuthProfile = {
        ...baseProfile,
        method: "login-flow",
        loginFlow: {
          loginUrl: "https://example.com/login",
          steps: [{ action: "fill", selector: "#user", value: "test" }],
          successIndicator: { type: "url-contains", value: "/dashboard" },
        },
      };
      const options = profileToAuthOptions(loginFlowProfile);
      expect(options.loginFlow?.loginUrl).toBe("https://example.com/login");
    });

    it("converts storage-state profile", () => {
      const storageStateProfile: AuthProfile = {
        ...baseProfile,
        method: "storage-state",
        storageState: { cookies: [] },
      };
      const options = profileToAuthOptions(storageStateProfile);
      expect(options.storageState).toEqual({ cookies: [] });
    });
  });

  describe("toggleProfileEnabled", () => {
    it("toggles enabled state", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      const result = toggleProfileEnabled("auth_123");
      expect(result).toBe(false);
      const saved = JSON.parse((window.localStorage.setItem as Mock).mock.calls[0][1]);
      expect(saved[0].enabled).toBe(false);
    });

    it("returns false for non-existent profile", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([]));
      const result = toggleProfileEnabled("non-existent");
      expect(result).toBe(false);
    });
  });

  describe("getAuthMethodLabel", () => {
    it("returns correct labels", () => {
      expect(getAuthMethodLabel("cookies")).toBe("Cookies");
      expect(getAuthMethodLabel("headers")).toBe("HTTP Headers");
      expect(getAuthMethodLabel("storage-state")).toBe("Storage State");
      expect(getAuthMethodLabel("login-flow")).toBe("Login Flow");
      expect(getAuthMethodLabel("basic-auth")).toBe("Basic Auth");
    });
  });

  describe("validateAuthProfile", () => {
    it("validates required fields", () => {
      const errors = validateAuthProfile({});
      expect(errors).toContain("Profile name is required");
      expect(errors).toContain("At least one domain is required");
      expect(errors).toContain("Authentication method is required");
    });

    it("validates cookies method", () => {
      const errors = validateAuthProfile({
        name: "Test",
        domains: ["example.com"],
        method: "cookies",
        cookies: [],
      });
      expect(errors).toContain("At least one cookie is required");
    });

    it("validates headers method", () => {
      const errors = validateAuthProfile({
        name: "Test",
        domains: ["example.com"],
        method: "headers",
        headers: {},
      });
      expect(errors).toContain("At least one header is required");
    });

    it("validates basic-auth method", () => {
      const errors = validateAuthProfile({
        name: "Test",
        domains: ["example.com"],
        method: "basic-auth",
        basicAuth: { username: "", password: "" },
      });
      expect(errors).toContain("Username and password are required");
    });

    it("validates login-flow method", () => {
      const errors = validateAuthProfile({
        name: "Test",
        domains: ["example.com"],
        method: "login-flow",
        loginFlow: { loginUrl: "", steps: [], successIndicator: { type: "url-contains", value: "" } },
      });
      expect(errors).toContain("Login URL is required");
      expect(errors).toContain("At least one login step is required");
      expect(errors).toContain("Success indicator is required");
    });

    it("validates storage-state method", () => {
      const errors = validateAuthProfile({
        name: "Test",
        domains: ["example.com"],
        method: "storage-state",
      });
      expect(errors).toContain("Storage state is required");
    });

    it("returns empty array for valid profile", () => {
      const errors = validateAuthProfile(baseProfile);
      expect(errors).toEqual([]);
    });
  });

  describe("exportProfiles", () => {
    it("exports profiles as JSON string", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      const exported = exportProfiles();
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe("Test Profile");
    });
  });

  describe("importProfiles", () => {
    it("imports new profiles", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([]));
      const result = importProfiles(JSON.stringify([baseProfile]));
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it("skips existing profiles without overwrite", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      const result = importProfiles(JSON.stringify([baseProfile]));
      expect(result.imported).toBe(0);
      expect(result.errors).toContain('Profile "Test Profile" already exists (skipped)');
    });

    it("overwrites existing profiles with overwrite flag", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseProfile]));
      const result = importProfiles(JSON.stringify([{ ...baseProfile, description: "Updated" }]), true);
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it("handles invalid JSON", () => {
      const result = importProfiles("invalid json");
      expect(result.imported).toBe(0);
      expect(result.errors).toContain("Invalid JSON format");
    });

    it("handles non-array input", () => {
      const result = importProfiles(JSON.stringify({ not: "an array" }));
      expect(result.imported).toBe(0);
      expect(result.errors).toContain("Invalid format: expected an array of profiles");
    });

    it("skips invalid profiles", () => {
      (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([]));
      const result = importProfiles(JSON.stringify([{ name: "Missing fields" }]));
      expect(result.imported).toBe(0);
      expect(result.errors[0]).toContain("Skipping invalid profile");
    });
  });
});
