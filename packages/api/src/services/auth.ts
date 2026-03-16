/**
 * Authentication Service
 *
 * Handles user and organization CRUD operations.
 * Uses dependency injection for storage backends.
 *
 * @see /wiki/User-Roles-Permissions.md for documentation
 */

import { createStorage } from '../utils/storage-factory.js';
import type { IStorage } from '../interfaces/storage.js';
import type {
  User,
  Organization,
  Role,
  Plan,
  UserResponse,
  OrganizationResponse,
} from '../types/auth.js';
import { PLAN_LIMITS, toUserResponse, toOrganizationResponse } from '../types/auth.js';
import crypto from 'crypto';
import argon2 from 'argon2';
import { config } from '../config/env.js';

// Password hashing with argon2
async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

// ============================================================================
// Interfaces
// ============================================================================

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role: Role;
  organizationId: string;
  avatarUrl?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
  avatarUrl?: string;
}

export interface CreateOrganizationInput {
  name: string;
  plan?: Plan;
  ownerId: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  plan?: Plan;
}

// ============================================================================
// AuthService Class
// ============================================================================

export class AuthService {
  constructor(
    private userStorage: IStorage<User>,
    private orgStorage: IStorage<Organization>,
  ) {}

  // ==========================================================================
  // Mock Data Initialization
  // ==========================================================================

  /**
   * Initialize mock data for development
   * This creates default users and organization if none exist
   */
  async initializeMockData(): Promise<void> {
    // Never initialize mock data in production
    if (config.nodeEnv === 'production') {
      return;
    }

    const existingUsers = await this.userStorage.getAll();

    // Skip if data already exists
    if (existingUsers.length > 0) {
      return;
    }

    // Use env var or generate random password for mock users
    const mockPassword = process.env.MOCK_USER_PASSWORD || crypto.randomBytes(16).toString('hex');
    console.log(`[dev] Mock user password: ${mockPassword}`);

    // Create mock organization
    const org: Organization = {
      id: 'org_acme',
      name: 'Acme Corp',
      plan: 'team',
      ownerId: 'user_admin',
      createdAt: new Date().toISOString(),
      limits: PLAN_LIMITS.team,
      usage: {
        scansThisMonth: 42,
        usersCount: 5,
      },
      settings: {
        defaultViewport: 'desktop',
        defaultStandard: 'wcag22aa',
        notificationsEnabled: true,
      },
    };
    await this.orgStorage.set(org.id, org);

    // Create mock users (one per role)
    const mockUsers: User[] = [
      {
        id: 'user_admin',
        email: 'admin@acme.com',
        name: 'Alice Admin',
        role: 'admin',
        organizationId: 'org_acme',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AA',
        createdAt: new Date().toISOString(),
        isActive: true,
        passwordHash: '', // set below
      },
      {
        id: 'user_manager',
        email: 'manager@acme.com',
        name: 'Mike Manager',
        role: 'manager',
        organizationId: 'org_acme',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=MM',
        createdAt: new Date().toISOString(),
        isActive: true,
        passwordHash: '',
      },
      {
        id: 'user_dev',
        email: 'dev@acme.com',
        name: 'Dana Developer',
        role: 'developer',
        organizationId: 'org_acme',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=DD',
        createdAt: new Date().toISOString(),
        isActive: true,
        passwordHash: '',
      },
      {
        id: 'user_viewer',
        email: 'viewer@acme.com',
        name: 'Victor Viewer',
        role: 'viewer',
        organizationId: 'org_acme',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=VV',
        createdAt: new Date().toISOString(),
        isActive: true,
        passwordHash: '',
      },
      {
        id: 'user_compliance',
        email: 'compliance@acme.com',
        name: 'Carla Compliance',
        role: 'compliance',
        organizationId: 'org_acme',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=CC',
        createdAt: new Date().toISOString(),
        isActive: true,
        passwordHash: '',
      },
    ];

    // Hash mock password with argon2
    const hashedMockPassword = await hashPassword(mockPassword);
    for (const user of mockUsers) {
      user.passwordHash = hashedMockPassword;
    }

    for (const user of mockUsers) {
      await this.userStorage.set(user.id, user);
    }

    await this.userStorage.flush();
    await this.orgStorage.flush();
  }

  // ==========================================================================
  // User Operations
  // ==========================================================================

  /**
   * Get a user by ID
   */
  async getUserById(id: string): Promise<User | undefined> {
    return this.userStorage.get(id);
  }

  /**
   * Get a user by email
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await this.userStorage.getAll();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Get all users in an organization
   */
  async getUsersByOrganization(organizationId: string): Promise<UserResponse[]> {
    const result = await this.userStorage.query({
      filter: (user) => user.organizationId === organizationId && user.isActive,
    });
    return result.items.map(toUserResponse);
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<UserResponse[]> {
    const users = await this.userStorage.getAll();
    return users.map(toUserResponse);
  }

  /**
   * Create a new user
   */
  async createUser(input: CreateUserInput): Promise<UserResponse> {
    // Check if email already exists
    const existing = await this.getUserByEmail(input.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    // Check organization exists
    const org = await this.orgStorage.get(input.organizationId);
    if (!org) {
      throw new Error('Organization not found');
    }

    // Check user limit
    const orgUsers = await this.getUsersByOrganization(input.organizationId);
    if (org.limits.usersAllowed !== -1 && orgUsers.length >= org.limits.usersAllowed) {
      throw new Error('Organization user limit reached');
    }

    const user: User = {
      id: generateId('user'),
      email: input.email.toLowerCase(),
      name: input.name,
      role: input.role,
      organizationId: input.organizationId,
      avatarUrl: input.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${input.name.split(' ').map(n => n[0]).join('')}`,
      createdAt: new Date().toISOString(),
      isActive: true,
      passwordHash: await hashPassword(input.password),
    };

    await this.userStorage.set(user.id, user);

    // Update organization user count
    org.usage.usersCount = orgUsers.length + 1;
    await this.orgStorage.set(org.id, org);

    return toUserResponse(user);
  }

  /**
   * Update a user
   */
  async updateUser(id: string, input: UpdateUserInput): Promise<UserResponse> {
    const user = await this.userStorage.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check email uniqueness if changing email
    if (input.email && input.email.toLowerCase() !== user.email) {
      const existing = await this.getUserByEmail(input.email);
      if (existing) {
        throw new Error('Email already registered');
      }
    }

    const updated: User = {
      ...user,
      ...input,
      email: input.email?.toLowerCase() ?? user.email,
      updatedAt: new Date().toISOString(),
    };

    await this.userStorage.set(id, updated);
    return toUserResponse(updated);
  }

  /**
   * Delete a user (soft delete - sets isActive to false)
   */
  async deleteUser(id: string): Promise<boolean> {
    const user = await this.userStorage.get(id);
    if (!user) {
      return false;
    }

    user.isActive = false;
    user.updatedAt = new Date().toISOString();
    await this.userStorage.set(id, user);
    return true;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    const user = await this.userStorage.get(id);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      await this.userStorage.set(id, user);
    }
  }

  /**
   * Authenticate a user by email and password
   */
  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.isActive || !user.passwordHash) {
      return null;
    }

    if (!await verifyPassword(password, user.passwordHash)) {
      return null;
    }

    await this.updateLastLogin(user.id);
    return user;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.userStorage.get(userId);
    if (!user || !user.passwordHash) {
      return false;
    }

    if (!await verifyPassword(currentPassword, user.passwordHash)) {
      return false;
    }

    user.passwordHash = await hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    await this.userStorage.set(userId, user);
    return true;
  }

  // ==========================================================================
  // Organization Operations
  // ==========================================================================

  /**
   * Get an organization by ID
   */
  async getOrganizationById(id: string): Promise<Organization | undefined> {
    return this.orgStorage.get(id);
  }

  /**
   * Get all organizations (super admin only)
   */
  async getAllOrganizations(): Promise<OrganizationResponse[]> {
    const orgs = await this.orgStorage.getAll();
    return orgs.map(toOrganizationResponse);
  }

  /**
   * Create a new organization
   */
  async createOrganization(input: CreateOrganizationInput): Promise<OrganizationResponse> {
    const plan = input.plan ?? 'free';

    const org: Organization = {
      id: generateId('org'),
      name: input.name,
      plan,
      ownerId: input.ownerId,
      createdAt: new Date().toISOString(),
      limits: PLAN_LIMITS[plan],
      usage: {
        scansThisMonth: 0,
        usersCount: 1,
      },
      settings: {
        defaultViewport: 'desktop',
        defaultStandard: 'wcag22aa',
        notificationsEnabled: true,
      },
    };

    await this.orgStorage.set(org.id, org);
    return toOrganizationResponse(org);
  }

  /**
   * Update an organization
   */
  async updateOrganization(id: string, input: UpdateOrganizationInput): Promise<OrganizationResponse> {
    const org = await this.orgStorage.get(id);
    if (!org) {
      throw new Error('Organization not found');
    }

    const updated: Organization = {
      ...org,
      ...input,
      limits: input.plan ? PLAN_LIMITS[input.plan] : org.limits,
      updatedAt: new Date().toISOString(),
    };

    await this.orgStorage.set(id, updated);
    return toOrganizationResponse(updated);
  }

  /**
   * Increment scan count for an organization
   */
  async incrementScanCount(organizationId: string): Promise<boolean> {
    const org = await this.orgStorage.get(organizationId);
    if (!org) {
      return false;
    }

    // Check if limit reached (unless unlimited)
    if (org.limits.scansPerMonth !== -1 && org.usage.scansThisMonth >= org.limits.scansPerMonth) {
      return false;
    }

    org.usage.scansThisMonth++;
    await this.orgStorage.set(organizationId, org);
    return true;
  }

  /**
   * Reset monthly scan counts (called by scheduled job)
   */
  async resetMonthlyScanCounts(): Promise<void> {
    const orgs = await this.orgStorage.getAll();
    for (const org of orgs) {
      org.usage.scansThisMonth = 0;
      await this.orgStorage.set(org.id, org);
    }
    await this.orgStorage.flush();
  }

  // ==========================================================================
  // Storage Access (for testing)
  // ==========================================================================

  getUserStorage(): IStorage<User> {
    return this.userStorage;
  }

  getOrganizationStorage(): IStorage<Organization> {
    return this.orgStorage;
  }
}

// ============================================================================
// Default Singleton Instance (backward compatibility)
// ============================================================================

const defaultUserStorage = createStorage<User>({ tableName: 'users', filename: 'users.json' });
const defaultOrgStorage = createStorage<Organization>({ tableName: 'organizations', filename: 'organizations.json' });

export const authService = new AuthService(defaultUserStorage, defaultOrgStorage);

// ============================================================================
// Re-exported functions for backward compatibility
// ============================================================================

export const initializeMockData = (...args: Parameters<AuthService['initializeMockData']>) =>
  authService.initializeMockData(...args);

export const getUserById = (...args: Parameters<AuthService['getUserById']>) =>
  authService.getUserById(...args);

export const getUserByEmail = (...args: Parameters<AuthService['getUserByEmail']>) =>
  authService.getUserByEmail(...args);

export const getUsersByOrganization = (...args: Parameters<AuthService['getUsersByOrganization']>) =>
  authService.getUsersByOrganization(...args);

export const getAllUsers = (...args: Parameters<AuthService['getAllUsers']>) =>
  authService.getAllUsers(...args);

export const createUser = (...args: Parameters<AuthService['createUser']>) =>
  authService.createUser(...args);

export const updateUser = (...args: Parameters<AuthService['updateUser']>) =>
  authService.updateUser(...args);

export const deleteUser = (...args: Parameters<AuthService['deleteUser']>) =>
  authService.deleteUser(...args);

export const updateLastLogin = (...args: Parameters<AuthService['updateLastLogin']>) =>
  authService.updateLastLogin(...args);

export const authenticateUser = (...args: Parameters<AuthService['authenticateUser']>) =>
  authService.authenticateUser(...args);

export const changePassword = (...args: Parameters<AuthService['changePassword']>) =>
  authService.changePassword(...args);

export const getOrganizationById = (...args: Parameters<AuthService['getOrganizationById']>) =>
  authService.getOrganizationById(...args);

export const getAllOrganizations = (...args: Parameters<AuthService['getAllOrganizations']>) =>
  authService.getAllOrganizations(...args);

export const createOrganization = (...args: Parameters<AuthService['createOrganization']>) =>
  authService.createOrganization(...args);

export const updateOrganization = (...args: Parameters<AuthService['updateOrganization']>) =>
  authService.updateOrganization(...args);

export const incrementScanCount = (...args: Parameters<AuthService['incrementScanCount']>) =>
  authService.incrementScanCount(...args);

export const resetMonthlyScanCounts = (...args: Parameters<AuthService['resetMonthlyScanCounts']>) =>
  authService.resetMonthlyScanCounts(...args);

export const getUserStorage = () => authService.getUserStorage();

export const getOrganizationStorage = () => authService.getOrganizationStorage();
