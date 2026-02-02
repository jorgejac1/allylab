import { describe, expect, it } from "vitest";
import {
  hasPermission,
  canAccessPage,
  getRolePermissions,
  getRolePages,
  hasAnyPermission,
  hasAllPermissions,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from "../../utils/permissions";
import type { Role, Permission, NavigationPage } from "../../types/auth";

describe("utils/permissions", () => {
  describe("hasPermission", () => {
    it("admin has all permissions", () => {
      const adminPermissions: Permission[] = [
        'scan:run',
        'scan:schedule',
        'findings:view',
        'fixes:generate',
        'fixes:create-pr',
        'reports:view',
        'executive:view',
        'users:view',
        'users:invite',
        'billing:view',
        'billing:manage',
        'settings:edit',
      ];

      adminPermissions.forEach((permission) => {
        expect(hasPermission('admin', permission)).toBe(true);
      });
    });

    it("viewer has limited permissions", () => {
      expect(hasPermission('viewer', 'findings:view')).toBe(true);
      expect(hasPermission('viewer', 'reports:view')).toBe(true);
      expect(hasPermission('viewer', 'executive:view')).toBe(true);

      // Viewer should not have these permissions
      expect(hasPermission('viewer', 'scan:run')).toBe(false);
      expect(hasPermission('viewer', 'fixes:generate')).toBe(false);
      expect(hasPermission('viewer', 'users:invite')).toBe(false);
      expect(hasPermission('viewer', 'billing:manage')).toBe(false);
    });

    it("developer can generate fixes and create PRs", () => {
      expect(hasPermission('developer', 'fixes:generate')).toBe(true);
      expect(hasPermission('developer', 'fixes:create-pr')).toBe(true);
      expect(hasPermission('developer', 'github:connect')).toBe(true);
      expect(hasPermission('developer', 'scan:run')).toBe(true);

      // Developer should not manage users or billing
      expect(hasPermission('developer', 'users:invite')).toBe(false);
      expect(hasPermission('developer', 'billing:manage')).toBe(false);
    });

    it("manager has oversight permissions but limited admin access", () => {
      expect(hasPermission('manager', 'users:view')).toBe(true);
      expect(hasPermission('manager', 'audit-logs:view')).toBe(true);
      expect(hasPermission('manager', 'scan:schedule')).toBe(true);

      // Manager should not be able to manage billing
      expect(hasPermission('manager', 'billing:manage')).toBe(false);
      expect(hasPermission('manager', 'users:invite')).toBe(false);
    });

    it("compliance has audit and export permissions", () => {
      expect(hasPermission('compliance', 'audit-logs:view')).toBe(true);
      expect(hasPermission('compliance', 'reports:export')).toBe(true);
      expect(hasPermission('compliance', 'jira:export')).toBe(true);

      // Compliance should not run scans
      expect(hasPermission('compliance', 'scan:run')).toBe(false);
      expect(hasPermission('compliance', 'fixes:generate')).toBe(false);
    });
  });

  describe("canAccessPage", () => {
    it("admin can access all pages", () => {
      const allPages: NavigationPage[] = ['scan', 'site-scan', 'reports', 'executive', 'benchmark', 'settings'];

      allPages.forEach((page) => {
        expect(canAccessPage('admin', page)).toBe(true);
      });
    });

    it("viewer can only access report-related pages", () => {
      expect(canAccessPage('viewer', 'reports')).toBe(true);
      expect(canAccessPage('viewer', 'executive')).toBe(true);
      expect(canAccessPage('viewer', 'benchmark')).toBe(true);

      expect(canAccessPage('viewer', 'scan')).toBe(false);
      expect(canAccessPage('viewer', 'site-scan')).toBe(false);
      expect(canAccessPage('viewer', 'settings')).toBe(false);
    });

    it("developer can access scan and settings but not executive", () => {
      expect(canAccessPage('developer', 'scan')).toBe(true);
      expect(canAccessPage('developer', 'site-scan')).toBe(true);
      expect(canAccessPage('developer', 'settings')).toBe(true);
      expect(canAccessPage('developer', 'reports')).toBe(true);

      expect(canAccessPage('developer', 'executive')).toBe(false);
      expect(canAccessPage('developer', 'benchmark')).toBe(false);
    });
  });

  describe("getRolePermissions", () => {
    it("returns array of permissions for each role", () => {
      const roles: Role[] = ['admin', 'manager', 'developer', 'viewer', 'compliance'];

      roles.forEach((role) => {
        const permissions = getRolePermissions(role);
        expect(Array.isArray(permissions)).toBe(true);
        expect(permissions.length).toBeGreaterThan(0);
      });
    });

    it("admin has the most permissions", () => {
      const adminPerms = getRolePermissions('admin');
      const viewerPerms = getRolePermissions('viewer');

      expect(adminPerms.length).toBeGreaterThan(viewerPerms.length);
    });
  });

  describe("getRolePages", () => {
    it("returns array of pages for each role", () => {
      const roles: Role[] = ['admin', 'manager', 'developer', 'viewer', 'compliance'];

      roles.forEach((role) => {
        const pages = getRolePages(role);
        expect(Array.isArray(pages)).toBe(true);
        expect(pages.length).toBeGreaterThan(0);
      });
    });
  });

  describe("hasAnyPermission", () => {
    it("returns true if role has at least one permission", () => {
      expect(hasAnyPermission('viewer', ['scan:run', 'reports:view'])).toBe(true);
      expect(hasAnyPermission('viewer', ['scan:run', 'billing:manage'])).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns true only if role has all permissions", () => {
      expect(hasAllPermissions('admin', ['scan:run', 'reports:view', 'billing:manage'])).toBe(true);
      expect(hasAllPermissions('viewer', ['reports:view', 'reports:export'])).toBe(true);
      expect(hasAllPermissions('viewer', ['reports:view', 'scan:run'])).toBe(false);
    });
  });

  describe("ROLE_LABELS", () => {
    it("has labels for all roles", () => {
      const roles: Role[] = ['admin', 'manager', 'developer', 'viewer', 'compliance'];

      roles.forEach((role) => {
        expect(ROLE_LABELS[role]).toBeDefined();
        expect(typeof ROLE_LABELS[role]).toBe('string');
        expect(ROLE_LABELS[role].length).toBeGreaterThan(0);
      });
    });
  });

  describe("ROLE_DESCRIPTIONS", () => {
    it("has descriptions for all roles", () => {
      const roles: Role[] = ['admin', 'manager', 'developer', 'viewer', 'compliance'];

      roles.forEach((role) => {
        expect(ROLE_DESCRIPTIONS[role]).toBeDefined();
        expect(typeof ROLE_DESCRIPTIONS[role]).toBe('string');
        expect(ROLE_DESCRIPTIONS[role].length).toBeGreaterThan(0);
      });
    });
  });
});
