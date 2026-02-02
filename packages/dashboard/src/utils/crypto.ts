/**
 * Crypto Utilities for Encrypting Sensitive Data in localStorage
 *
 * Uses Web Crypto API (SubtleCrypto) for AES-GCM encryption.
 * A device-specific key is derived from a passphrase stored in localStorage.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

// Key for storing the device passphrase
const PASSPHRASE_KEY = 'allylab_device_key';

/**
 * Generate a random passphrase for this device/browser
 */
function generatePassphrase(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create the device passphrase
 */
function getDevicePassphrase(): string {
  let passphrase = localStorage.getItem(PASSPHRASE_KEY);
  if (!passphrase) {
    passphrase = generatePassphrase();
    localStorage.setItem(PASSPHRASE_KEY, passphrase);
  }
  return passphrase;
}

/**
 * Derive an encryption key from a passphrase using PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a string value
 * Returns a base64-encoded string containing: salt + iv + ciphertext
 */
export async function encrypt(plaintext: string): Promise<string> {
  const passphrase = getDevicePassphrase();
  const encoder = new TextEncoder();

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive key from passphrase
  const key = await deriveKey(passphrase, salt);

  // Encrypt the plaintext
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv as BufferSource },
    key,
    encoder.encode(plaintext) as BufferSource
  );

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a string value
 * Expects base64-encoded string containing: salt + iv + ciphertext
 */
export async function decrypt(encryptedData: string): Promise<string> {
  const passphrase = getDevicePassphrase();
  const decoder = new TextDecoder();

  // Decode from base64
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

  // Extract salt, iv, and ciphertext
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

  // Derive key from passphrase
  const key = await deriveKey(passphrase, salt);

  // Decrypt
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );

  return decoder.decode(plaintext);
}

/**
 * Check if a string looks like encrypted data (base64 with minimum length)
 */
export function isEncrypted(data: string): boolean {
  if (!data || data.length < 44) return false; // minimum: 16 salt + 12 iv + some ciphertext in base64
  try {
    // Check if it's valid base64
    atob(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Encrypt sensitive fields in an object
 */
export async function encryptSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  sensitiveKeys: string[]
): Promise<T> {
  const result = { ...obj };

  for (const key of sensitiveKeys) {
    if (key in result && typeof result[key] === 'string') {
      (result as Record<string, unknown>)[key] = await encrypt(result[key] as string);
    }
  }

  return result;
}

/**
 * Decrypt sensitive fields in an object
 */
export async function decryptSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  sensitiveKeys: string[]
): Promise<T> {
  const result = { ...obj };

  for (const key of sensitiveKeys) {
    if (key in result && typeof result[key] === 'string' && isEncrypted(result[key] as string)) {
      try {
        (result as Record<string, unknown>)[key] = await decrypt(result[key] as string);
      } catch {
        // If decryption fails, leave the value as-is
        console.warn(`Failed to decrypt field: ${key}`);
      }
    }
  }

  return result;
}

// Type for auth profile with optional sensitive fields
interface AuthProfileFields {
  cookies?: Array<{ value?: string }>;
  headers?: Record<string, string>;
  basicAuth?: { username?: string; password?: string };
  loginFlow?: { steps?: Array<{ value?: string }> };
  _encrypted?: boolean;
}

/**
 * Encrypt an entire auth profile's sensitive data
 */
export async function encryptAuthProfile<T extends AuthProfileFields>(profile: T): Promise<T> {
  const result = { ...profile } as T & AuthProfileFields;

  // Encrypt cookie values
  if (Array.isArray(result.cookies)) {
    result.cookies = await Promise.all(
      result.cookies.map(async (cookie) => ({
        ...cookie,
        value: cookie.value ? await encrypt(cookie.value) : cookie.value,
      }))
    );
  }

  // Encrypt header values
  if (result.headers && typeof result.headers === 'object') {
    const encryptedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(result.headers)) {
      encryptedHeaders[key] = await encrypt(value);
    }
    result.headers = encryptedHeaders;
  }

  // Encrypt basic auth credentials
  if (result.basicAuth && typeof result.basicAuth === 'object') {
    result.basicAuth = {
      username: result.basicAuth.username ? await encrypt(result.basicAuth.username) : result.basicAuth.username,
      password: result.basicAuth.password ? await encrypt(result.basicAuth.password) : result.basicAuth.password,
    };
  }

  // Encrypt login flow step values
  if (result.loginFlow && typeof result.loginFlow === 'object') {
    if (Array.isArray(result.loginFlow.steps)) {
      result.loginFlow.steps = await Promise.all(
        result.loginFlow.steps.map(async (step) => ({
          ...step,
          value: step.value ? await encrypt(step.value) : step.value,
        }))
      );
    }
  }

  // Mark as encrypted
  result._encrypted = true;

  return result as T;
}

/**
 * Decrypt an entire auth profile's sensitive data
 */
export async function decryptAuthProfile<T extends AuthProfileFields>(profile: T): Promise<T> {
  // Skip if not encrypted
  if (!profile._encrypted) {
    return profile;
  }

  const result = { ...profile } as T & AuthProfileFields;

  // Decrypt cookie values
  if (Array.isArray(result.cookies)) {
    result.cookies = await Promise.all(
      result.cookies.map(async (cookie) => ({
        ...cookie,
        value: cookie.value && isEncrypted(cookie.value) ? await decrypt(cookie.value) : cookie.value,
      }))
    );
  }

  // Decrypt header values
  if (result.headers && typeof result.headers === 'object') {
    const decryptedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(result.headers)) {
      decryptedHeaders[key] = isEncrypted(value) ? await decrypt(value) : value;
    }
    result.headers = decryptedHeaders;
  }

  // Decrypt basic auth credentials
  if (result.basicAuth && typeof result.basicAuth === 'object') {
    result.basicAuth = {
      username: result.basicAuth.username && isEncrypted(result.basicAuth.username) ? await decrypt(result.basicAuth.username) : result.basicAuth.username,
      password: result.basicAuth.password && isEncrypted(result.basicAuth.password) ? await decrypt(result.basicAuth.password) : result.basicAuth.password,
    };
  }

  // Decrypt login flow step values
  if (result.loginFlow && typeof result.loginFlow === 'object') {
    if (Array.isArray(result.loginFlow.steps)) {
      result.loginFlow.steps = await Promise.all(
        result.loginFlow.steps.map(async (step) => ({
          ...step,
          value: step.value && isEncrypted(step.value) ? await decrypt(step.value) : step.value,
        }))
      );
    }
  }

  // Remove encrypted marker
  delete result._encrypted;

  return result as T;
}
