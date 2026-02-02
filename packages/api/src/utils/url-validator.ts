/**
 * URL Validator - SSRF Protection
 *
 * Validates URLs to prevent Server-Side Request Forgery attacks.
 * Blocks access to internal networks, localhost, and private IP ranges.
 */

import { config } from '../config/env.js';

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  url?: URL;
}

// Private IP ranges that should be blocked
const PRIVATE_IP_PATTERNS = [
  /^127\./,                           // Localhost (127.0.0.0/8)
  /^10\./,                            // Class A private (10.0.0.0/8)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,   // Class B private (172.16.0.0/12)
  /^192\.168\./,                      // Class C private (192.168.0.0/16)
  /^169\.254\./,                      // Link-local (169.254.0.0/16)
  /^0\./,                             // Current network (0.0.0.0/8)
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // Carrier-grade NAT
  /^192\.0\.0\./,                     // IETF Protocol Assignments
  /^192\.0\.2\./,                     // Documentation (TEST-NET-1)
  /^198\.51\.100\./,                  // Documentation (TEST-NET-2)
  /^203\.0\.113\./,                   // Documentation (TEST-NET-3)
  /^224\./,                           // Multicast
  /^240\./,                           // Reserved
  /^255\./,                           // Broadcast
];

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'local',
  '0.0.0.0',
  '::1',
  '::',
  '[::1]',
  '[::ffff:127.0.0.1]',
];

// Blocked TLDs (internal domains)
const BLOCKED_TLDS = [
  '.local',
  '.internal',
  '.intra',
  '.corp',
  '.home',
  '.lan',
  '.localdomain',
  '.localhost',
];

// Allowed protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Check if an IP address is in a private range
 */
function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some(pattern => pattern.test(ip));
}

/**
 * Check if a hostname is blocked
 */
function isBlockedHostname(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();

  // Check exact matches
  if (BLOCKED_HOSTNAMES.includes(lowerHostname)) {
    return true;
  }

  // Check blocked TLDs
  if (BLOCKED_TLDS.some(tld => lowerHostname.endsWith(tld))) {
    return true;
  }

  // Check if it's a raw IP address in private range
  if (isPrivateIP(lowerHostname)) {
    return true;
  }

  return false;
}

/**
 * Validate a URL for safe scanning
 *
 * Returns validation result with parsed URL if valid,
 * or error message if invalid/blocked
 */
export function validateUrl(urlString: string): UrlValidationResult {
  // Check for empty input
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmedUrl = urlString.trim();

  if (trimmedUrl.length === 0) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  // Check URL length (prevent DoS with very long URLs)
  if (trimmedUrl.length > 2048) {
    return { valid: false, error: 'URL exceeds maximum length (2048 characters)' };
  }

  // Parse URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Check protocol
  if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
    return {
      valid: false,
      error: `Invalid protocol: ${parsedUrl.protocol}. Only HTTP and HTTPS are allowed`
    };
  }

  // Check for blocked hostnames
  if (isBlockedHostname(parsedUrl.hostname)) {
    return {
      valid: false,
      error: 'Access to internal/private networks is not allowed'
    };
  }

  // Check for IP-based hostnames that might be private
  // This catches IPv4 addresses directly in the URL
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(parsedUrl.hostname)) {
    if (isPrivateIP(parsedUrl.hostname)) {
      return {
        valid: false,
        error: 'Access to private IP addresses is not allowed'
      };
    }
  }

  // Check for IPv6 addresses (enclosed in brackets)
  if (parsedUrl.hostname.startsWith('[') && parsedUrl.hostname.endsWith(']')) {
    const ipv6 = parsedUrl.hostname.slice(1, -1).toLowerCase();
    if (ipv6 === '::1' || ipv6 === '::' || ipv6.startsWith('fe80:') || ipv6.startsWith('fc') || ipv6.startsWith('fd')) {
      return {
        valid: false,
        error: 'Access to private IPv6 addresses is not allowed'
      };
    }
  }

  // Check for username/password in URL (potential security issue)
  if (parsedUrl.username || parsedUrl.password) {
    return {
      valid: false,
      error: 'URLs with embedded credentials are not allowed'
    };
  }

  // Check port (block common internal service ports in development)
  const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : null;
  const blockedPorts = [22, 23, 25, 110, 143, 389, 445, 3306, 5432, 6379, 27017];
  if (port && blockedPorts.includes(port)) {
    return {
      valid: false,
      error: `Port ${port} is not allowed for security reasons`
    };
  }

  // In production, optionally allow only standard web ports
  if (config.nodeEnv === 'production' && port && ![80, 443, 8080, 8443].includes(port)) {
    return {
      valid: false,
      error: 'Only standard web ports (80, 443, 8080, 8443) are allowed in production'
    };
  }

  return { valid: true, url: parsedUrl };
}

/**
 * Validate URL and throw an error if invalid
 */
export function validateUrlOrThrow(urlString: string): URL {
  const result = validateUrl(urlString);
  if (!result.valid || !result.url) {
    throw new Error(result.error || 'Invalid URL');
  }
  return result.url;
}

/**
 * Check if URL validation is enabled
 * Can be disabled for testing with DISABLE_SSRF_PROTECTION=true
 */
export function isSSRFProtectionEnabled(): boolean {
  return config.enableSSRFProtection;
}

/**
 * Validate URL with optional bypass for testing
 */
export function validateUrlWithConfig(urlString: string): UrlValidationResult {
  // Allow bypass in development/testing only
  if (!isSSRFProtectionEnabled() && config.nodeEnv !== 'production') {
    try {
      const url = new URL(urlString);
      return { valid: true, url };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  return validateUrl(urlString);
}
