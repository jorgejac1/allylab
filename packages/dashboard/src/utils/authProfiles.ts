/**
 * Auth Profiles Storage Utilities
 *
 * Manages authentication profiles for scanning protected pages.
 * Profiles are stored in localStorage with optional encryption.
 */

import type { AuthProfile, ScanAuthOptions } from '../types/auth';
import { STORAGE_KEYS } from '../config';
import { encryptAuthProfile, decryptAuthProfile } from './crypto';

// Feature flag for encryption (can be toggled)
let encryptionEnabled = true;

/**
 * Enable or disable encryption for auth profiles
 */
export function setEncryptionEnabled(enabled: boolean): void {
  encryptionEnabled = enabled;
}

/**
 * Check if encryption is enabled
 */
export function isEncryptionEnabled(): boolean {
  return encryptionEnabled;
}

/**
 * Generate a unique ID for a new profile
 */
function generateId(): string {
  return `auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Load all authentication profiles from localStorage
 */
export function getAuthProfiles(): AuthProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH_PROFILES);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Get a single authentication profile by ID
 */
export function getAuthProfile(id: string): AuthProfile | undefined {
  return getAuthProfiles().find(p => p.id === id);
}

/**
 * Save or update an authentication profile
 */
export function saveAuthProfile(profile: Omit<AuthProfile, 'id' | 'createdAt'> & { id?: string }): AuthProfile {
  const profiles = getAuthProfiles();
  const now = new Date().toISOString();

  let savedProfile: AuthProfile;

  if (profile.id) {
    // Update existing profile
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index === -1) {
      throw new Error('Profile not found');
    }
    savedProfile = {
      ...profiles[index],
      ...profile,
      id: profile.id,
      updatedAt: now,
    };
    profiles[index] = savedProfile;
  } else {
    // Create new profile
    savedProfile = {
      ...profile,
      id: generateId(),
      createdAt: now,
    } as AuthProfile;
    profiles.push(savedProfile);
  }

  localStorage.setItem(STORAGE_KEYS.AUTH_PROFILES, JSON.stringify(profiles));
  return savedProfile;
}

/**
 * Delete an authentication profile
 */
export function deleteAuthProfile(id: string): boolean {
  const profiles = getAuthProfiles();
  const filtered = profiles.filter(p => p.id !== id);

  if (filtered.length === profiles.length) {
    return false; // Profile not found
  }

  localStorage.setItem(STORAGE_KEYS.AUTH_PROFILES, JSON.stringify(filtered));
  return true;
}

/**
 * Find a profile that matches a given domain
 * Supports wildcard patterns like *.example.com
 */
export function findProfileForDomain(domain: string): AuthProfile | undefined {
  const profiles = getAuthProfiles().filter(p => p.enabled);

  for (const profile of profiles) {
    for (const pattern of profile.domains) {
      if (matchDomainPattern(domain, pattern)) {
        return profile;
      }
    }
  }

  return undefined;
}

/**
 * Match a domain against a pattern (supports wildcards)
 */
function matchDomainPattern(domain: string, pattern: string): boolean {
  // Exact match
  if (domain === pattern) return true;

  // Wildcard pattern (e.g., *.example.com)
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(1); // Remove the *
    return domain.endsWith(suffix) || domain === pattern.slice(2);
  }

  return false;
}

/**
 * Convert an AuthProfile to ScanAuthOptions for the API
 */
export function profileToAuthOptions(profile: AuthProfile): ScanAuthOptions {
  const options: ScanAuthOptions = {};

  switch (profile.method) {
    case 'cookies':
      options.cookies = profile.cookies;
      break;
    case 'headers':
      options.headers = profile.headers;
      break;
    case 'storage-state':
      options.storageState = profile.storageState;
      break;
    case 'login-flow':
      options.loginFlow = profile.loginFlow;
      break;
    case 'basic-auth':
      options.basicAuth = profile.basicAuth;
      break;
  }

  return options;
}

/**
 * Update the lastUsed timestamp for a profile
 */
export function markProfileUsed(id: string): void {
  const profiles = getAuthProfiles();
  const index = profiles.findIndex(p => p.id === id);

  if (index !== -1) {
    profiles[index].lastUsed = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.AUTH_PROFILES, JSON.stringify(profiles));
  }
}

/**
 * Toggle the enabled state of a profile
 */
export function toggleProfileEnabled(id: string): boolean {
  const profiles = getAuthProfiles();
  const index = profiles.findIndex(p => p.id === id);

  if (index === -1) return false;

  profiles[index].enabled = !profiles[index].enabled;
  profiles[index].updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.AUTH_PROFILES, JSON.stringify(profiles));

  return profiles[index].enabled;
}

/**
 * Get the display name for an auth method
 */
export function getAuthMethodLabel(method: AuthProfile['method']): string {
  const labels: Record<AuthProfile['method'], string> = {
    cookies: 'Cookies',
    headers: 'HTTP Headers',
    'storage-state': 'Storage State',
    'login-flow': 'Login Flow',
    'basic-auth': 'Basic Auth',
  };
  return labels[method];
}

// ============================================
// Profile Health & Expiration Warnings
// ============================================

// Thresholds for profile health (in days)
const HEALTH_THRESHOLDS = {
  WARNING_DAYS: 7,    // Warn if not tested in 7 days
  EXPIRED_DAYS: 30,   // Consider expired if not tested in 30 days
};

/**
 * Calculate days since a given date
 */
function daysSince(dateStr: string | undefined): number | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check the health status of an auth profile
 */
export function checkProfileHealth(profile: AuthProfile): {
  status: 'healthy' | 'warning' | 'expired' | 'untested';
  message: string;
  daysSinceTest?: number;
  daysSinceUse?: number;
} {
  const daysSinceTest = daysSince(profile.lastTested);
  const daysSinceUse = daysSince(profile.lastUsed);

  // Never tested
  if (daysSinceTest === undefined) {
    return {
      status: 'untested',
      message: 'Profile has never been tested. Test to verify credentials work.',
      daysSinceUse,
    };
  }

  // Last test failed
  if (profile.lastTestResult && !profile.lastTestResult.success) {
    return {
      status: 'expired',
      message: `Last test failed: ${profile.lastTestResult.message}`,
      daysSinceTest,
      daysSinceUse,
    };
  }

  // Check expiration thresholds
  if (daysSinceTest >= HEALTH_THRESHOLDS.EXPIRED_DAYS) {
    return {
      status: 'expired',
      message: `Not tested in ${daysSinceTest} days. Credentials may have expired.`,
      daysSinceTest,
      daysSinceUse,
    };
  }

  if (daysSinceTest >= HEALTH_THRESHOLDS.WARNING_DAYS) {
    return {
      status: 'warning',
      message: `Last tested ${daysSinceTest} days ago. Consider re-testing.`,
      daysSinceTest,
      daysSinceUse,
    };
  }

  return {
    status: 'healthy',
    message: `Tested ${daysSinceTest} day${daysSinceTest === 1 ? '' : 's'} ago`,
    daysSinceTest,
    daysSinceUse,
  };
}

/**
 * Update profile with test result
 */
export function updateProfileTestResult(
  id: string,
  success: boolean,
  message: string,
  statusCode?: number
): void {
  const profiles = getAuthProfiles();
  const index = profiles.findIndex(p => p.id === id);

  if (index !== -1) {
    const now = new Date().toISOString();
    profiles[index].lastTested = now;
    profiles[index].lastTestResult = {
      success,
      message,
      statusCode,
      testedAt: now,
    };
    profiles[index].updatedAt = now;
    localStorage.setItem(STORAGE_KEYS.AUTH_PROFILES, JSON.stringify(profiles));
  }
}

/**
 * Get all profiles that need attention (warning or expired)
 */
export function getProfilesNeedingAttention(): Array<{
  profile: AuthProfile;
  health: ReturnType<typeof checkProfileHealth>;
}> {
  const profiles = getAuthProfiles().filter(p => p.enabled);
  const results: Array<{
    profile: AuthProfile;
    health: ReturnType<typeof checkProfileHealth>;
  }> = [];

  for (const profile of profiles) {
    const health = checkProfileHealth(profile);
    if (health.status !== 'healthy') {
      results.push({ profile, health });
    }
  }

  // Sort by severity: expired > warning > untested > healthy
  const statusOrder: Record<string, number> = { expired: 0, warning: 1, untested: 2, healthy: 3 };
  results.sort((a, b) => (statusOrder[a.health.status] ?? 3) - (statusOrder[b.health.status] ?? 3));

  return results;
}

/**
 * Validate an auth profile
 */
export function validateAuthProfile(profile: Partial<AuthProfile>): string[] {
  const errors: string[] = [];

  if (!profile.name?.trim()) {
    errors.push('Profile name is required');
  }

  if (!profile.domains || profile.domains.length === 0) {
    errors.push('At least one domain is required');
  }

  if (!profile.method) {
    errors.push('Authentication method is required');
  }

  // Method-specific validation
  switch (profile.method) {
    case 'cookies':
      if (!profile.cookies || profile.cookies.length === 0) {
        errors.push('At least one cookie is required');
      }
      break;
    case 'headers':
      if (!profile.headers || Object.keys(profile.headers).length === 0) {
        errors.push('At least one header is required');
      }
      break;
    case 'storage-state':
      if (!profile.storageState) {
        errors.push('Storage state is required');
      }
      break;
    case 'login-flow':
      if (!profile.loginFlow) {
        errors.push('Login flow configuration is required');
      } else {
        if (!profile.loginFlow.loginUrl) {
          errors.push('Login URL is required');
        }
        if (!profile.loginFlow.steps || profile.loginFlow.steps.length === 0) {
          errors.push('At least one login step is required');
        }
        if (!profile.loginFlow.successIndicator?.value) {
          errors.push('Success indicator is required');
        }
      }
      break;
    case 'basic-auth':
      if (!profile.basicAuth?.username || !profile.basicAuth?.password) {
        errors.push('Username and password are required');
      }
      break;
  }

  return errors;
}

/**
 * Export all profiles as a JSON string for backup/sharing
 */
export function exportProfiles(): string {
  const profiles = getAuthProfiles();
  return JSON.stringify(profiles, null, 2);
}

/**
 * Import profiles from JSON string
 * Returns array of imported profile IDs
 */
export function importProfiles(jsonStr: string, overwrite = false): { imported: number; errors: string[] } {
  const errors: string[] = [];
  let imported = 0;

  try {
    const profiles = JSON.parse(jsonStr);

    if (!Array.isArray(profiles)) {
      return { imported: 0, errors: ['Invalid format: expected an array of profiles'] };
    }

    const existingProfiles = getAuthProfiles();

    for (const profile of profiles) {
      // Validate basic structure
      if (!profile.name || !profile.method || !profile.domains) {
        errors.push(`Skipping invalid profile: ${profile.name || 'unnamed'}`);
        continue;
      }

      // Check for existing profile with same name
      const existingIndex = existingProfiles.findIndex(p => p.name === profile.name);

      if (existingIndex !== -1) {
        if (overwrite) {
          // Update existing profile
          existingProfiles[existingIndex] = {
            ...existingProfiles[existingIndex],
            ...profile,
            id: existingProfiles[existingIndex].id, // Keep original ID
            updatedAt: new Date().toISOString(),
          };
          imported++;
        } else {
          errors.push(`Profile "${profile.name}" already exists (skipped)`);
        }
      } else {
        // Create new profile with new ID
        existingProfiles.push({
          ...profile,
          id: `auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          createdAt: new Date().toISOString(),
        });
        imported++;
      }
    }

    localStorage.setItem(STORAGE_KEYS.AUTH_PROFILES, JSON.stringify(existingProfiles));

    return { imported, errors };
  } catch {
    return { imported: 0, errors: ['Invalid JSON format'] };
  }
}

/**
 * Test auth profile interface result
 */
export interface ProfileTestResult {
  success: boolean;
  message: string;
  statusCode?: number;
  authenticatedContent?: boolean;
  error?: string;
}

// ============================================
// Async Encryption-Aware Functions
// ============================================

/**
 * Load all authentication profiles with decryption
 */
export async function getAuthProfilesAsync(): Promise<AuthProfile[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH_PROFILES);
    if (!data) return [];

    const profiles = JSON.parse(data) as AuthProfile[];

    if (!encryptionEnabled) {
      return profiles;
    }

    // Decrypt each profile
    return Promise.all(
      profiles.map(async (profile) => {
        try {
          return await decryptAuthProfile(profile as unknown as Record<string, unknown>) as unknown as AuthProfile;
        } catch {
          // Return as-is if decryption fails
          return profile;
        }
      })
    );
  } catch {
    return [];
  }
}

/**
 * Get a single authentication profile by ID with decryption
 */
export async function getAuthProfileAsync(id: string): Promise<AuthProfile | undefined> {
  const profiles = await getAuthProfilesAsync();
  return profiles.find(p => p.id === id);
}

/**
 * Save or update an authentication profile with encryption
 */
export async function saveAuthProfileAsync(
  profile: Omit<AuthProfile, 'id' | 'createdAt'> & { id?: string }
): Promise<AuthProfile> {
  const profiles = getAuthProfiles(); // Get raw (possibly encrypted) profiles
  const now = new Date().toISOString();

  let savedProfile: AuthProfile;

  // Encrypt the profile if encryption is enabled
  let profileToSave = profile;
  if (encryptionEnabled) {
    profileToSave = await encryptAuthProfile(profile as unknown as Record<string, unknown>) as unknown as typeof profile;
  }

  if (profile.id) {
    // Update existing profile
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index === -1) {
      throw new Error('Profile not found');
    }
    savedProfile = {
      ...profiles[index],
      ...profileToSave,
      id: profile.id,
      updatedAt: now,
    };
    profiles[index] = savedProfile;
  } else {
    // Create new profile
    savedProfile = {
      ...profileToSave,
      id: generateId(),
      createdAt: now,
    } as AuthProfile;
    profiles.push(savedProfile);
  }

  localStorage.setItem(STORAGE_KEYS.AUTH_PROFILES, JSON.stringify(profiles));

  // Return decrypted version for immediate use
  if (encryptionEnabled) {
    return await decryptAuthProfile(savedProfile as unknown as Record<string, unknown>) as unknown as AuthProfile;
  }
  return savedProfile;
}

/**
 * Get profile for API use (decrypted)
 */
export async function getDecryptedProfileForApi(id: string): Promise<AuthProfile | undefined> {
  return getAuthProfileAsync(id);
}

/**
 * Convert profile to auth options with decryption
 */
export async function profileToAuthOptionsAsync(profile: AuthProfile): Promise<ScanAuthOptions> {
  // Decrypt the profile first if needed
  const decrypted = encryptionEnabled
    ? await decryptAuthProfile(profile as unknown as Record<string, unknown>) as unknown as AuthProfile
    : profile;

  return profileToAuthOptions(decrypted);
}

/**
 * Migrate existing unencrypted profiles to encrypted format
 */
export async function migrateToEncryptedStorage(): Promise<{ migrated: number; errors: string[] }> {
  const errors: string[] = [];
  let migrated = 0;

  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH_PROFILES);
    if (!data) return { migrated: 0, errors: [] };

    const profiles = JSON.parse(data) as AuthProfile[];
    const encryptedProfiles: AuthProfile[] = [];

    for (const profile of profiles) {
      // Skip if already encrypted
      if ((profile as unknown as Record<string, unknown>)._encrypted) {
        encryptedProfiles.push(profile);
        continue;
      }

      try {
        const encrypted = await encryptAuthProfile(profile as unknown as Record<string, unknown>);
        encryptedProfiles.push(encrypted as unknown as AuthProfile);
        migrated++;
      } catch (err) {
        errors.push(`Failed to encrypt profile "${profile.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
        encryptedProfiles.push(profile); // Keep original
      }
    }

    localStorage.setItem(STORAGE_KEYS.AUTH_PROFILES, JSON.stringify(encryptedProfiles));

    return { migrated, errors };
  } catch {
    return { migrated: 0, errors: ['Failed to read profiles'] };
  }
}

