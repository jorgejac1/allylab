// Auth configuration
export { authConfig, planToPriceId, getPlanFromPriceId } from './config';

// Mock auth utilities (for development)
export {
  AUTH_STORAGE_KEY,
  USERS_STORAGE_KEY,
  MOCK_USERS,
  DEMO_ACCOUNTS,
  getAllUsers,
  registerUser,
  authenticateUser,
  getSession,
  getCurrentUser,
  signOut,
  isAuthenticated,
  updateSessionUser,
  ROLE_LABELS,
  PLAN_LABELS,
  type Role,
  type Plan,
  type MockUser,
  type MockSession,
} from './mock';

// Mock auth context
export { MockAuthProvider, useMockAuth, useRequireAuth } from './MockAuthContext';

// Clerk utilities
export {
  getOrCreateOrganization,
  updateOrganizationSubscription,
  getOrganizationWithDetails,
  updateUserRole,
  getUserRole,
  inviteToOrganization,
  removeFromOrganization,
} from './clerk';

// Stripe utilities
export {
  getStripe,
  createCheckoutSession,
  createBillingPortalSession,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  updateSubscriptionPlan,
  type BillingInterval,
} from './stripe';
