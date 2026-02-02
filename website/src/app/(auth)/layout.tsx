import { Suspense } from 'react';

export const metadata = {
  title: 'Authentication - AllyLab',
  description: 'Sign in or create an account to access AllyLab',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-bg-primary to-surface-secondary">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </div>
    }>
      {children}
    </Suspense>
  );
}
