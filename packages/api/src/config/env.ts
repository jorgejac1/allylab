import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Generate a random JWT secret if not provided (for development only)
const defaultJwtSecret = process.env.NODE_ENV === 'production'
  ? undefined  // Force explicit secret in production
  : crypto.randomBytes(32).toString('hex');

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  // Feature flags
  enableAiFixes: !!process.env.ANTHROPIC_API_KEY,
  githubApiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',

  // Clerk configuration
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,

  // Security settings
  jwtSecret: process.env.JWT_SECRET || defaultJwtSecret || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  enableSSRFProtection: process.env.DISABLE_SSRF_PROTECTION !== 'true',
  enableRateLimiting: process.env.DISABLE_RATE_LIMITING !== 'true',
  enableAuth: process.env.DISABLE_AUTH !== 'true',

  // Rate limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitTimeWindow: process.env.RATE_LIMIT_TIME_WINDOW || '1 minute',
  scanRateLimitMax: parseInt(process.env.SCAN_RATE_LIMIT_MAX || '10', 10),
  scanRateLimitTimeWindow: process.env.SCAN_RATE_LIMIT_TIME_WINDOW || '1 minute',

  // Scan timeouts (in milliseconds)
  scanNavigationTimeout: parseInt(process.env.SCAN_NAVIGATION_TIMEOUT || '60000', 10),
  scanTotalTimeout: parseInt(process.env.SCAN_TOTAL_TIMEOUT || '300000', 10), // 5 minutes
  scanPageAcquireTimeout: parseInt(process.env.SCAN_PAGE_ACQUIRE_TIMEOUT || '60000', 10),

  // Token encryption
  encryptionKey: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
} as const;

// Validate production configuration
if (config.nodeEnv === 'production') {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET must be set in production');
    process.exit(1);
  }
  if (!process.env.ENCRYPTION_KEY) {
    console.warn('WARNING: ENCRYPTION_KEY not set, using random key (tokens will be invalid after restart)');
  }
}