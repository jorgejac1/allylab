'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthForm } from '@/components/forms/AuthForm';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { registerUser, authenticateUser, isAuthenticated } from '@/lib/auth/mock';
import { CheckCircle, Shield, Zap, GitBranch, FileCheck } from 'lucide-react';

const DASHBOARD_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5173'
  : '/dashboard';

const FEATURES = [
  { icon: Shield, text: 'Unlimited accessibility scans' },
  { icon: Zap, text: 'AI-powered fix suggestions' },
  { icon: GitBranch, text: 'GitHub & GitLab integration' },
  { icon: FileCheck, text: 'WCAG 2.0, 2.1, 2.2 support' },
];

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || DASHBOARD_URL;

  // Check if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.push(redirect);
    }
  }, [redirect, router]);

  const handleSignUp = async (data: { email: string; password: string; name?: string }) => {
    if (!data.name) {
      return { success: false, error: 'Name is required' };
    }

    const result = registerUser(data.email, data.password, data.name);

    if (result.success) {
      // Auto sign in
      const signInResult = authenticateUser(data.email, data.password);
      if (signInResult.success && signInResult.session) {
        // For cross-origin redirect (different port), pass session via URL
        if (redirect.startsWith('http://localhost:5173')) {
          const sessionParam = encodeURIComponent(JSON.stringify(signInResult.session));
          window.location.href = `${redirect}?session=${sessionParam}`;
        } else {
          window.location.href = redirect;
        }
        return { success: true };
      }
    }

    return { success: false, error: result.error };
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
          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-text-secondary">
            Start scanning for accessibility issues today
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Sign Up Form */}
          <Card hover={false} className="p-8">
            <h2 className="text-lg font-semibold mb-6">Get started for free</h2>
            <AuthForm mode="signup" onSubmit={handleSignUp} />

            {/* Sign in link */}
            <div className="mt-6 text-center text-sm">
              <span className="text-text-muted">Already have an account? </span>
              <Link href="/sign-in" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </Card>

          {/* Right Column - Features */}
          <Card hover={false} className="p-8">
            <h2 className="text-lg font-semibold mb-6">What you get with AllyLab</h2>
            <ul className="space-y-4">
              {FEATURES.map((feature) => (
                <li key={feature.text} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="pt-2">
                    <span className="text-text-secondary">{feature.text}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 p-4 bg-surface-secondary rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-primary" />
                <span className="font-medium">14-day free trial</span>
              </div>
              <p className="text-sm text-text-muted">
                No credit card required. Cancel anytime.
              </p>
            </div>
          </Card>
        </div>

        {/* Dev Mode Badge */}
        <div className="text-center mt-8">
          <Badge variant="orange">Development Mode</Badge>
          <p className="text-xs text-text-muted mt-2">
            Using mock authentication. Accounts are stored locally.
          </p>
        </div>
      </div>
    </div>
  );
}
