import type { ReactNode } from 'react';
import { useAuth } from '../../contexts';
import type { Role, Permission, NavigationPage } from '../../types/auth';

interface RoleGuardProps {
  children: ReactNode;
  /** Fallback content when access is denied */
  fallback?: ReactNode;
}

interface PermissionGuardProps extends RoleGuardProps {
  /** Single permission required */
  permission?: Permission;
  /** Multiple permissions - user needs ANY of these */
  anyOf?: Permission[];
  /** Multiple permissions - user needs ALL of these */
  allOf?: Permission[];
}

interface RoleBasedGuardProps extends RoleGuardProps {
  /** Allowed roles */
  roles: Role[];
}

interface PageGuardProps extends RoleGuardProps {
  /** Page to check access for */
  page: NavigationPage;
}

/**
 * Guard component that renders children only if user has the required permission(s).
 *
 * @example
 * ```tsx
 * // Single permission
 * <PermissionGuard permission="fixes:generate">
 *   <GenerateFixButton />
 * </PermissionGuard>
 *
 * // Any of multiple permissions
 * <PermissionGuard anyOf={["fixes:generate", "fixes:create-pr"]}>
 *   <FixActionsMenu />
 * </PermissionGuard>
 *
 * // All of multiple permissions
 * <PermissionGuard allOf={["users:invite", "users:change-role"]}>
 *   <UserManagementPanel />
 * </PermissionGuard>
 *
 * // With fallback
 * <PermissionGuard permission="billing:view" fallback={<UpgradePrompt />}>
 *   <BillingDashboard />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  children,
  fallback = null,
  permission,
  anyOf,
  allOf,
}: PermissionGuardProps) {
  const { can, hasAnyPermission, hasAllPermissions } = useAuth();

  let hasAccess = true;

  if (permission) {
    hasAccess = can(permission);
  } else if (anyOf && anyOf.length > 0) {
    hasAccess = hasAnyPermission(anyOf);
  } else if (allOf && allOf.length > 0) {
    hasAccess = hasAllPermissions(allOf);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Guard component that renders children only if user has one of the allowed roles.
 *
 * @example
 * ```tsx
 * <RoleGuard roles={["admin", "manager"]}>
 *   <AdminPanel />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({ children, fallback = null, roles }: RoleBasedGuardProps) {
  const { role } = useAuth();

  if (!role || !roles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Guard component that renders children only if user can access the specified page.
 *
 * @example
 * ```tsx
 * <PageGuard page="executive">
 *   <ExecutiveDashboard />
 * </PageGuard>
 * ```
 */
export function PageGuard({ children, fallback = null, page }: PageGuardProps) {
  const { canAccessPage } = useAuth();

  if (!canAccessPage(page)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Guard that only renders for authenticated users.
 *
 * @example
 * ```tsx
 * <AuthGuard fallback={<LoginPage />}>
 *   <Dashboard />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({ children, fallback = null }: RoleGuardProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Guard that only renders for admin users.
 */
export function AdminOnly({ children, fallback = null }: RoleGuardProps) {
  return (
    <RoleGuard roles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Guard that only renders for users who can scan (admin, manager, developer).
 */
export function CanScan({ children, fallback = null }: RoleGuardProps) {
  return (
    <PermissionGuard permission="scan:run" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Guard that only renders for users who can generate fixes.
 */
export function CanGenerateFixes({ children, fallback = null }: RoleGuardProps) {
  return (
    <PermissionGuard permission="fixes:generate" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Guard that only renders for users who can create PRs.
 */
export function CanCreatePR({ children, fallback = null }: RoleGuardProps) {
  return (
    <PermissionGuard permission="fixes:create-pr" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Guard that only renders for users who can view executive dashboard.
 */
export function CanViewExecutive({ children, fallback = null }: RoleGuardProps) {
  return (
    <PermissionGuard permission="executive:view" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Guard that only renders for users who can manage users.
 */
export function CanManageUsers({ children, fallback = null }: RoleGuardProps) {
  return (
    <PermissionGuard anyOf={['users:invite', 'users:remove', 'users:change-role']} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}
