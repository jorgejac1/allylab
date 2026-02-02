/**
 * Cryptographic Utilities
 *
 * Provides encryption/decryption for sensitive data like API tokens.
 * Uses AES-256-GCM for authenticated encryption.
 */

import crypto from 'crypto';
import { config } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Derive a key from the encryption key using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    config.encryptionKey,
    salt,
    100000, // iterations
    32,     // key length for AES-256
    'sha256'
  );
}

/**
 * Encrypt a string value
 *
 * Returns a base64-encoded string containing:
 * - Salt (32 bytes)
 * - IV (16 bytes)
 * - Auth Tag (16 bytes)
 * - Encrypted data (variable)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty value');
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Combine: salt + iv + tag + encrypted
  const combined = Buffer.concat([salt, iv, tag, encrypted]);

  return combined.toString('base64');
}

/**
 * Decrypt an encrypted string
 *
 * Expects a base64-encoded string from encrypt()
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    throw new Error('Cannot decrypt empty value');
  }

  const combined = Buffer.from(ciphertext, 'base64');

  if (combined.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error('Invalid encrypted data');
  }

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = deriveKey(salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Hash a value (one-way, for storage where we don't need to recover the original)
 */
export function hash(value: string): string {
  return crypto
    .createHmac('sha256', config.encryptionKey)
    .update(value)
    .digest('hex');
}

/**
 * Generate a random token
 */
export function generateRandomToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Constant-time string comparison (prevents timing attacks)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Mask a token for display (show first 4 and last 4 characters)
 */
export function maskToken(token: string): string {
  if (token.length <= 8) {
    return '****';
  }
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

/**
 * Encrypted token storage
 */
export class SecureTokenStore {
  private tokens = new Map<string, string>();

  /**
   * Store a token (encrypted)
   */
  set(key: string, token: string): void {
    const encrypted = encrypt(token);
    this.tokens.set(key, encrypted);
  }

  /**
   * Retrieve a token (decrypted)
   */
  get(key: string): string | undefined {
    const encrypted = this.tokens.get(key);
    if (!encrypted) return undefined;

    try {
      return decrypt(encrypted);
    } catch {
      // If decryption fails (e.g., key changed), remove the invalid token
      this.tokens.delete(key);
      return undefined;
    }
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.tokens.has(key);
  }

  /**
   * Remove a token
   */
  delete(key: string): boolean {
    return this.tokens.delete(key);
  }

  /**
   * Get masked token for display
   */
  getMasked(key: string): string | undefined {
    const token = this.get(key);
    return token ? maskToken(token) : undefined;
  }

  /**
   * Clear all tokens
   */
  clear(): void {
    this.tokens.clear();
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.tokens.keys());
  }
}

// Singleton instances for common token stores
export const githubTokenStore = new SecureTokenStore();
export const jiraTokenStore = new SecureTokenStore();
