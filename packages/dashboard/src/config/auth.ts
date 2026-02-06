/**
 * Dashboard Auth Configuration
 *
 * Supports two modes:
 * 1. Production: Uses Clerk for authentication
 * 2. Development: Uses mock data for testing different roles
 */

const isDev = import.meta.env.DEV;

export const authConfig = {
  // Clerk configuration
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,

  // API URL for backend requests
  apiUrl: import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:3001' : 'https://allylab-api.onrender.com'),

  // Website URL for redirects
  websiteUrl: import.meta.env.VITE_WEBSITE_URL || (isDev ? 'http://localhost:3000' : 'https://allylab.io'),

  // Enable mock auth in development
  useMockAuth: import.meta.env.VITE_USE_MOCK_AUTH === 'true' ||
    (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && import.meta.env.DEV),
} as const;

// Check if Clerk is properly configured
export function isClerkConfigured(): boolean {
  return Boolean(authConfig.clerkPublishableKey);
}

// Check if we should use mock auth
export function shouldUseMockAuth(): boolean {
  return authConfig.useMockAuth || !isClerkConfigured();
}
