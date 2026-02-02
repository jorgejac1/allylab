'use client';

import { useEffect } from 'react';
import { signOut } from '@/lib/auth/mock';

export default function SignOutPage() {
  useEffect(() => {
    // Clear the session
    signOut();
    // Redirect to sign-in page
    window.location.href = '/sign-in';
  }, []);

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-to-b from-bg-primary to-surface-secondary">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-text-secondary">Signing out...</p>
      </div>
    </div>
  );
}
