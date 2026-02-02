'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSubmit: (data: { email: string; password: string; name?: string; rememberMe?: boolean }) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

export function AuthForm({ mode, onSubmit, isLoading = false }: AuthFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (mode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (!formData.name.trim()) {
        setError('Name is required');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        email: formData.email,
        password: formData.password,
        ...(mode === 'signup' && { name: formData.name }),
        ...(mode === 'signin' && { rememberMe }),
      });

      if (!result.success) {
        setError(result.error || 'An error occurred');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const inputClass = `w-full px-4 py-3 bg-surface-secondary border border-border rounded-lg
    focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
    disabled:opacity-50 disabled:cursor-not-allowed transition-colors`;

  const loading = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-accent-red/10 border border-accent-red/30 rounded-lg">
          <AlertCircle className="text-accent-red flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-accent-red">{error}</p>
        </div>
      )}

      {/* Name field (signup only) */}
      {mode === 'signup' && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={inputClass}
            placeholder="John Doe"
            required
            disabled={loading}
            autoComplete="name"
          />
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={inputClass}
          placeholder="you@company.com"
          required
          disabled={loading}
          autoComplete="email"
        />
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          {mode === 'signin' && (
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          )}
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`${inputClass} pr-12`}
            placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
            required
            disabled={loading}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={mode === 'signup' ? 6 : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Confirm Password (signup only) */}
      {mode === 'signup' && (
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={inputClass}
            placeholder="Confirm your password"
            required
            disabled={loading}
            autoComplete="new-password"
          />
        </div>
      )}

      {/* Remember me (signin only) */}
      {mode === 'signin' && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 rounded border-border bg-surface-secondary text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
          />
          <label htmlFor="rememberMe" className="text-sm text-text-secondary cursor-pointer select-none">
            Remember me for 30 days
          </label>
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
          </>
        ) : mode === 'signin' ? (
          'Sign In'
        ) : (
          'Create Account'
        )}
      </Button>

      {/* Terms (signup only) */}
      {mode === 'signup' && (
        <p className="text-xs text-text-muted text-center">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </form>
  );
}
