'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthForm } from '@/components/forms/AuthForm';
import { DemoAccounts } from '@/components/forms/DemoAccounts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { authenticateUser, isAuthenticated } from '@/lib/auth/mock';
import { AlertCircle } from 'lucide-react';

const DASHBOARD_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5173'
  : '/dashboard';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || DASHBOARD_URL;
  const sessionExpired = searchParams.get('expired') === 'true';

  // Check if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.push(redirect);
    }
  }, [redirect, router]);

  const handleSignIn = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    const result = authenticateUser(data.email, data.password, data.rememberMe ?? false);

    if (result.success && result.session) {
      // For cross-origin redirect (different port), pass session via URL
      if (redirect.startsWith('http://localhost:5173')) {
        const sessionParam = encodeURIComponent(JSON.stringify(result.session));
        window.location.href = `${redirect}?session=${sessionParam}`;
      } else {
        window.location.href = redirect;
      }
      return { success: true };
    }

    return { success: false, error: result.error };
  };

  const handleDemoSelect = (email: string, password: string) => {
    handleSignIn({ email, password });
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-bg-primary to-surface-secondary">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-black">A</span>
            </div>
            <span className="text-2xl font-bold">AllyLab</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-text-secondary">
            Sign in to your account to continue
          </p>
        </div>

        {/* Session Expired Message */}
        {sessionExpired && (
          <div className="max-w-2xl mx-auto mb-8 flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-amber-500">Session expired</p>
              <p className="text-sm text-text-secondary">Your session has expired. Please sign in again to continue.</p>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Sign In Form */}
          <Card hover={false} className="p-8">
            <h2 className="text-lg font-semibold mb-6">Sign in with your credentials</h2>
            <AuthForm
              mode="signin"
              onSubmit={handleSignIn}
            />

            {/* Sign up link */}
            <div className="mt-6 text-center text-sm">
              <span className="text-text-muted">Don't have an account? </span>
              <Link href="/sign-up" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </Card>

          {/* Right Column - Demo Accounts */}
          <Card hover={false} className="p-8">
            <DemoAccounts onSelect={handleDemoSelect} />
          </Card>
        </div>

        {/* Dev Mode Badge */}
        <div className="text-center mt-8">
          <Badge variant="orange">Development Mode</Badge>
          <p className="text-xs text-text-muted mt-2">
            Using mock authentication. No real data is stored.
          </p>
        </div>
      </div>
    </div>
  );
}
