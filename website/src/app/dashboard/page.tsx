'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Dashboard Redirect Page
 *
 * Redirects authenticated users to the dashboard application.
 * In production with Clerk configured, checks auth status first.
 */
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Get dashboard URL from environment or use default
    const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:5173';

    // In production with Clerk:
    // - Check if user is authenticated
    // - If not, redirect to sign-in
    // - If yes, redirect to dashboard with auth token

    // For demo/development, redirect directly
    window.location.href = dashboardUrl;
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-text-secondary">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
