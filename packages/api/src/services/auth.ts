/**
 * Authentication Service
 *
 * Handles user and organization CRUD operations.
 * Uses JSON storage for persistence (can be swapped for database).
 *
 * @see /wiki/User-Roles-Permissions.md for documentation
 */

import { JsonStorage } from '../utils/storage.js';
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

// Storage instances
const userStorage = new JsonStorage<User>({ filename: 'users.json' });
const organizationStorage = new JsonStorage<Organization>({ filename: 'organizations.json' });

// Simple password hashing (in production, use bcrypt or argon2)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Initialize mock data for development
 * This creates default users and organization if none exist
 */
export async function initializeMockData(): Promise<void> {
  const existingUsers = await userStorage.getAll();

  // Skip if data already exists
  if (existingUsers.length > 0) {
    return;
  }

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
  await organizationStorage.set(org.id, org);

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
      passwordHash: hashPassword('admin123'),
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
      passwordHash: hashPassword('manager123'),
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
      passwordHash: hashPassword('dev123'),
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
      passwordHash: hashPassword('viewer123'),
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
      passwordHash: hashPassword('compliance123'),
    },
  ];

  for (const user of mockUsers) {
    await userStorage.set(user.id, user);
  }

  await userStorage.flush();
  await organizationStorage.flush();
}

// ============================================================================
// User Operations
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

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<User | undefined> {
  return userStorage.get(id);
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const users = await userStorage.getAll();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

/**
 * Get all users in an organization
 */
export async function getUsersByOrganization(organizationId: string): Promise<UserResponse[]> {
  const result = await userStorage.query({
    filter: (user) => user.organizationId === organizationId && user.isActive,
  });
  return result.items.map(toUserResponse);
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<UserResponse[]> {
  const users = await userStorage.getAll();
  return users.map(toUserResponse);
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<UserResponse> {
  // Check if email already exists
  const existing = await getUserByEmail(input.email);
  if (existing) {
    throw new Error('Email already registered');
  }

  // Check organization exists
  const org = await organizationStorage.get(input.organizationId);
  if (!org) {
    throw new Error('Organization not found');
  }

  // Check user limit
  const orgUsers = await getUsersByOrganization(input.organizationId);
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
    passwordHash: hashPassword(input.password),
  };

  await userStorage.set(user.id, user);

  // Update organization user count
  org.usage.usersCount = orgUsers.length + 1;
  await organizationStorage.set(org.id, org);

  return toUserResponse(user);
}

/**
 * Update a user
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<UserResponse> {
  const user = await userStorage.get(id);
  if (!user) {
    throw new Error('User not found');
  }

  // Check email uniqueness if changing email
  if (input.email && input.email.toLowerCase() !== user.email) {
    const existing = await getUserByEmail(input.email);
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

  await userStorage.set(id, updated);
  return toUserResponse(updated);
}

/**
 * Delete a user (soft delete - sets isActive to false)
 */
export async function deleteUser(id: string): Promise<boolean> {
  const user = await userStorage.get(id);
  if (!user) {
    return false;
  }

  user.isActive = false;
  user.updatedAt = new Date().toISOString();
  await userStorage.set(id, user);
  return true;
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(id: string): Promise<void> {
  const user = await userStorage.get(id);
  if (user) {
    user.lastLoginAt = new Date().toISOString();
    await userStorage.set(id, user);
  }
}

/**
 * Authenticate a user by email and password
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user || !user.isActive || !user.passwordHash) {
    return null;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  await updateLastLogin(user.id);
  return user;
}

/**
 * Change user password
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const user = await userStorage.get(userId);
  if (!user || !user.passwordHash) {
    return false;
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return false;
  }

  user.passwordHash = hashPassword(newPassword);
  user.updatedAt = new Date().toISOString();
  await userStorage.set(userId, user);
  return true;
}

// ============================================================================
// Organization Operations
// ============================================================================

export interface CreateOrganizationInput {
  name: string;
  plan?: Plan;
  ownerId: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  plan?: Plan;
}

/**
 * Get an organization by ID
 */
export async function getOrganizationById(id: string): Promise<Organization | undefined> {
  return organizationStorage.get(id);
}

/**
 * Get all organizations (super admin only)
 */
export async function getAllOrganizations(): Promise<OrganizationResponse[]> {
  const orgs = await organizationStorage.getAll();
  return orgs.map(toOrganizationResponse);
}

/**
 * Create a new organization
 */
export async function createOrganization(input: CreateOrganizationInput): Promise<OrganizationResponse> {
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

  await organizationStorage.set(org.id, org);
  return toOrganizationResponse(org);
}

/**
 * Update an organization
 */
export async function updateOrganization(id: string, input: UpdateOrganizationInput): Promise<OrganizationResponse> {
  const org = await organizationStorage.get(id);
  if (!org) {
    throw new Error('Organization not found');
  }

  const updated: Organization = {
    ...org,
    ...input,
    limits: input.plan ? PLAN_LIMITS[input.plan] : org.limits,
    updatedAt: new Date().toISOString(),
  };

  await organizationStorage.set(id, updated);
  return toOrganizationResponse(updated);
}

/**
 * Increment scan count for an organization
 */
export async function incrementScanCount(organizationId: string): Promise<boolean> {
  const org = await organizationStorage.get(organizationId);
  if (!org) {
    return false;
  }

  // Check if limit reached (unless unlimited)
  if (org.limits.scansPerMonth !== -1 && org.usage.scansThisMonth >= org.limits.scansPerMonth) {
    return false;
  }

  org.usage.scansThisMonth++;
  await organizationStorage.set(organizationId, org);
  return true;
}

/**
 * Reset monthly scan counts (called by scheduled job)
 */
export async function resetMonthlyScanCounts(): Promise<void> {
  const orgs = await organizationStorage.getAll();
  for (const org of orgs) {
    org.usage.scansThisMonth = 0;
    await organizationStorage.set(org.id, org);
  }
  await organizationStorage.flush();
}

// ============================================================================
// Storage Access (for testing)
// ============================================================================

export function getUserStorage(): typeof userStorage {
  return userStorage;
}

export function getOrganizationStorage(): typeof organizationStorage {
  return organizationStorage;
}
