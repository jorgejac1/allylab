import { describe, expect, it } from "vitest";
import {
  MOCK_USERS,
  MOCK_ORGANIZATION,
  DEFAULT_USER,
  PLAN_SETTINGS,
  getUserById,
  getUserByEmail,
  getOrganizationUsers,
} from "../../data/mockAuth";
import type { Role, Plan } from "../../types/auth";

describe("data/mockAuth", () => {
  describe("MOCK_USERS", () => {
    it("contains users for all roles", () => {
      const roles: Role[] = ['admin', 'manager', 'developer', 'viewer', 'compliance'];

      roles.forEach((role) => {
        const user = MOCK_USERS.find((u) => u.role === role);
        expect(user).toBeDefined();
        expect(user?.role).toBe(role);
      });
    });

    it("all users have required fields", () => {
      MOCK_USERS.forEach((user) => {
        expect(user.id).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.name).toBeDefined();
        expect(user.role).toBeDefined();
        expect(user.organizationId).toBeDefined();
        expect(user.createdAt).toBeDefined();
      });
    });

    it("all users belong to the mock organization", () => {
      MOCK_USERS.forEach((user) => {
        expect(user.organizationId).toBe(MOCK_ORGANIZATION.id);
      });
    });
  });

  describe("MOCK_ORGANIZATION", () => {
    it("has all required fields", () => {
      expect(MOCK_ORGANIZATION.id).toBeDefined();
      expect(MOCK_ORGANIZATION.name).toBeDefined();
      expect(MOCK_ORGANIZATION.plan).toBeDefined();
      expect(MOCK_ORGANIZATION.ownerId).toBeDefined();
      expect(MOCK_ORGANIZATION.createdAt).toBeDefined();
      expect(MOCK_ORGANIZATION.settings).toBeDefined();
    });

    it("owner exists in mock users", () => {
      const owner = MOCK_USERS.find((u) => u.id === MOCK_ORGANIZATION.ownerId);
      expect(owner).toBeDefined();
      expect(owner?.role).toBe('admin');
    });
  });

  describe("DEFAULT_USER", () => {
    it("is an admin user", () => {
      expect(DEFAULT_USER.role).toBe('admin');
    });

    it("exists in MOCK_USERS", () => {
      const exists = MOCK_USERS.some((u) => u.id === DEFAULT_USER.id);
      expect(exists).toBe(true);
    });
  });

  describe("PLAN_SETTINGS", () => {
    it("has settings for all plans", () => {
      const plans: Plan[] = ['free', 'pro', 'team', 'enterprise'];

      plans.forEach((plan) => {
        expect(PLAN_SETTINGS[plan]).toBeDefined();
      });
    });

    it("free plan has limited features", () => {
      const free = PLAN_SETTINGS.free;

      expect(free.maxUsers).toBe(1);
      expect(free.scheduledScans).toBe(false);
      expect(free.jiraIntegration).toBe(false);
      expect(free.apiAccess).toBe(false);
      expect(free.ssoEnabled).toBe(false);
    });

    it("enterprise plan has unlimited features", () => {
      const enterprise = PLAN_SETTINGS.enterprise;

      expect(enterprise.maxUsers).toBe(-1);
      expect(enterprise.maxScansPerMonth).toBe(-1);
      expect(enterprise.ssoEnabled).toBe(true);
      expect(enterprise.selfHosted).toBe(true);
      expect(enterprise.auditLogs).toBe(true);
    });

    it("each plan has progressive features", () => {
      const free = PLAN_SETTINGS.free;
      const pro = PLAN_SETTINGS.pro;
      const team = PLAN_SETTINGS.team;

      // Users increase with plan
      expect(pro.maxUsers).toBeGreaterThan(free.maxUsers);
      expect(team.maxUsers).toBeGreaterThan(pro.maxUsers);

      // API rate limits increase
      expect(pro.maxApiRequestsPerHour).toBeGreaterThan(free.maxApiRequestsPerHour);
      expect(team.maxApiRequestsPerHour).toBeGreaterThan(pro.maxApiRequestsPerHour);

      // Enterprise has unlimited users (-1 means unlimited)
      expect(PLAN_SETTINGS.enterprise.maxUsers).toBe(-1);
    });

    it("export formats increase with plan tier", () => {
      const free = PLAN_SETTINGS.free;
      const pro = PLAN_SETTINGS.pro;
      const team = PLAN_SETTINGS.team;

      expect(free.exportFormats.length).toBeLessThan(pro.exportFormats.length);
      expect(pro.exportFormats.length).toBeLessThanOrEqual(team.exportFormats.length);
    });
  });

  describe("getUserById", () => {
    it("returns user when found", () => {
      const user = getUserById('user_admin');

      expect(user).toBeDefined();
      expect(user?.id).toBe('user_admin');
      expect(user?.role).toBe('admin');
    });

    it("returns undefined for non-existent user", () => {
      const user = getUserById('user_nonexistent');
      expect(user).toBeUndefined();
    });
  });

  describe("getUserByEmail", () => {
    it("returns user when found", () => {
      const user = getUserByEmail('admin@acme.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('admin@acme.com');
      expect(user?.role).toBe('admin');
    });

    it("returns undefined for non-existent email", () => {
      const user = getUserByEmail('nonexistent@acme.com');
      expect(user).toBeUndefined();
    });
  });

  describe("getOrganizationUsers", () => {
    it("returns all users in the organization", () => {
      const users = getOrganizationUsers(MOCK_ORGANIZATION.id);

      expect(users.length).toBe(MOCK_USERS.length);
      users.forEach((user) => {
        expect(user.organizationId).toBe(MOCK_ORGANIZATION.id);
      });
    });

    it("returns empty array for non-existent organization", () => {
      const users = getOrganizationUsers('org_nonexistent');
      expect(users).toEqual([]);
    });
  });
});
