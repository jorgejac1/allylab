import { describe, expect, it } from "vitest";
import { authConfig, shouldUseMockAuth, isClerkConfigured } from "../../config/auth";

describe("config/auth", () => {
  describe("authConfig", () => {
    it("has apiUrl", () => {
      expect(authConfig.apiUrl).toBeDefined();
      expect(typeof authConfig.apiUrl).toBe('string');
    });

    it("has websiteUrl", () => {
      expect(authConfig.websiteUrl).toBeDefined();
      expect(typeof authConfig.websiteUrl).toBe('string');
    });

    it("defaults to localhost URLs in development", () => {
      // In test environment without env vars, should have defaults
      expect(authConfig.apiUrl).toContain('localhost');
      expect(authConfig.websiteUrl).toContain('localhost');
    });
  });

  describe("shouldUseMockAuth", () => {
    it("returns a boolean", () => {
      const result = shouldUseMockAuth();
      expect(typeof result).toBe('boolean');
    });
  });

  describe("isClerkConfigured", () => {
    it("returns a boolean", () => {
      const result = isClerkConfigured();
      expect(typeof result).toBe('boolean');
    });

    it("returns false when no Clerk key is set", () => {
      // In test environment without Clerk key
      expect(isClerkConfigured()).toBe(false);
    });
  });
});
