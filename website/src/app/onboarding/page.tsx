'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check, Building2, CreditCard, Rocket, ArrowRight, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import type { Plan } from '@/lib/auth/types';

type BillingInterval = 'monthly' | 'yearly';

interface PlanOption {
  id: Plan;
  name: string;
  price: { monthly: number; yearly: number };
  description: string;
  features: string[];
  popular?: boolean;
}

const plans: PlanOption[] = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for getting started',
    features: [
      '10 scans per month',
      '5 pages per scan',
      'Basic WCAG testing',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 49, yearly: 490 },
    description: 'For growing teams',
    features: [
      '100 scans per month',
      '25 pages per scan',
      'AI-powered fixes',
      'GitHub & GitLab integration',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: { monthly: 149, yearly: 1490 },
    description: 'For organizations',
    features: [
      '500 scans per month',
      '100 pages per scan',
      'Custom rules',
      'API access',
      'Dedicated support',
    ],
  },
];

const steps = [
  { id: 'organization', title: 'Create Organization', icon: Building2 },
  { id: 'plan', title: 'Choose Plan', icon: CreditCard },
  { id: 'complete', title: 'Get Started', icon: Rocket },
];

// Mock mode component (when Clerk is not configured)
function MockOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [orgName, setOrgName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan>('team');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const handleCreateOrganization = () => {
    if (!orgName.trim()) {
      setError('Please enter an organization name');
      return;
    }

    // Store in localStorage for demo mode
    localStorage.setItem('allylab_demo_org', JSON.stringify({
      name: orgName,
      createdAt: new Date().toISOString(),
    }));

    setCurrentStep(1);
    setError(null);
  };

  const handleSelectPlan = () => {
    setIsLoading(true);

    // Store selected plan in localStorage
    const orgData = JSON.parse(localStorage.getItem('allylab_demo_org') || '{}');
    localStorage.setItem('allylab_demo_org', JSON.stringify({
      ...orgData,
      plan: selectedPlan,
      billingInterval,
      subscriptionStatus: selectedPlan === 'free' ? null : 'active',
      trialEndsAt: selectedPlan !== 'free'
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : null,
    }));

    // Simulate processing
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(2);
    }, 500);
  };

  const handleComplete = () => {
    window.location.href = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:5173';
  };

  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Demo Mode Banner */}
        <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
          <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-500">Demo Mode</p>
            <p className="text-xs text-text-secondary">
              Running without Clerk authentication. Data is stored locally for demonstration.
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      index < currentStep
                        ? 'bg-primary text-black'
                        : index === currentStep
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-surface-tertiary text-text-muted'
                    }`}
                  >
                    {index < currentStep ? (
                      <Check size={20} />
                    ) : (
                      <step.icon size={20} />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-sm ${
                      index <= currentStep ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-primary' : 'bg-surface-tertiary'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card hover={false} className="p-8">
          {/* Step 1: Organization */}
          {currentStep === 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Create your organization</h2>
              <p className="text-text-secondary mb-6">
                This will be your team workspace in AllyLab.
              </p>

              <div className="mb-6">
                <label htmlFor="orgName" className="block text-sm font-medium mb-2">
                  Organization Name
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}

              <Button
                onClick={handleCreateOrganization}
                disabled={!orgName.trim()}
                className="w-full"
              >
                Continue
                <ArrowRight size={18} />
              </Button>
            </div>
          )}

          {/* Step 2: Plan Selection */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose your plan</h2>
              <p className="text-text-secondary mb-6">
                Start with a free plan or unlock more features with Pro or Team.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    billingInterval === 'monthly'
                      ? 'bg-primary text-black'
                      : 'bg-surface-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    billingInterval === 'yearly'
                      ? 'bg-primary text-black'
                      : 'bg-surface-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Yearly <span className="text-xs opacity-75">(Save 17%)</span>
                </button>
              </div>

              {/* Plan Cards */}
              <div className="grid gap-4 mb-8">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-border-light'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{plan.name}</span>
                          {plan.popular && (
                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-text-secondary text-sm">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">
                          ${plan.price[billingInterval]}
                        </span>
                        {plan.price[billingInterval] > 0 && (
                          <span className="text-text-muted text-sm">
                            /{billingInterval === 'yearly' ? 'year' : 'month'}
                          </span>
                        )}
                      </div>
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {plan.features.map((feature, i) => (
                        <li
                          key={i}
                          className="text-xs text-text-secondary bg-surface-tertiary px-2 py-1 rounded"
                        >
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep(0)}
                  disabled={isLoading}
                >
                  <ArrowLeft size={18} />
                  Back
                </Button>
                <Button
                  onClick={handleSelectPlan}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : selectedPlan === 'free' ? (
                    <>
                      Continue with Free
                      <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      Start with {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
                      <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 2 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">You&apos;re all set!</h2>
              <p className="text-text-secondary mb-8">
                Your organization is ready. Let&apos;s start scanning for accessibility issues.
              </p>
              <Button onClick={handleComplete} size="lg">
                Go to Dashboard
                <Rocket size={18} />
              </Button>
            </div>
          )}
        </Card>

        {/* Help Text */}
        <p className="text-center text-text-muted text-sm mt-8">
          Need help?{' '}
          <a href="/contact" className="text-primary hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

// Production component (with Clerk)
function ClerkOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Form state
  const [orgName, setOrgName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan>('free');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  // Dynamically import Clerk to check availability
  useEffect(() => {
    import('@clerk/nextjs').then(() => {
      // Clerk is available
      setIsReady(true);
    }).catch(() => {
      // Clerk not available, redirect to mock
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      setError('Please enter an organization name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create organization');
      }

      setCurrentStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (selectedPlan === 'free') {
        await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: 'free' }),
        });
        setCurrentStep(2);
      } else {
        const response = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: selectedPlan,
            interval: billingInterval,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create checkout session');
        }

        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    window.location.href = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:5173';
  };

  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      index < currentStep
                        ? 'bg-primary text-black'
                        : index === currentStep
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-surface-tertiary text-text-muted'
                    }`}
                  >
                    {index < currentStep ? (
                      <Check size={20} />
                    ) : (
                      <step.icon size={20} />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-sm ${
                      index <= currentStep ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-primary' : 'bg-surface-tertiary'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card hover={false} className="p-8">
          {/* Step 1: Organization */}
          {currentStep === 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Create your organization</h2>
              <p className="text-text-secondary mb-6">
                This will be your team workspace in AllyLab.
              </p>

              <div className="mb-6">
                <label htmlFor="orgName" className="block text-sm font-medium mb-2">
                  Organization Name
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}

              <Button
                onClick={handleCreateOrganization}
                disabled={isLoading || !orgName.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Plan Selection */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose your plan</h2>
              <p className="text-text-secondary mb-6">
                Start with a free plan or unlock more features with Pro or Team.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    billingInterval === 'monthly'
                      ? 'bg-primary text-black'
                      : 'bg-surface-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    billingInterval === 'yearly'
                      ? 'bg-primary text-black'
                      : 'bg-surface-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Yearly <span className="text-xs opacity-75">(Save 17%)</span>
                </button>
              </div>

              {/* Plan Cards */}
              <div className="grid gap-4 mb-8">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-border-light'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{plan.name}</span>
                          {plan.popular && (
                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-text-secondary text-sm">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">
                          ${plan.price[billingInterval]}
                        </span>
                        {plan.price[billingInterval] > 0 && (
                          <span className="text-text-muted text-sm">
                            /{billingInterval === 'yearly' ? 'year' : 'month'}
                          </span>
                        )}
                      </div>
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {plan.features.map((feature, i) => (
                        <li
                          key={i}
                          className="text-xs text-text-secondary bg-surface-tertiary px-2 py-1 rounded"
                        >
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}

              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep(0)}
                  disabled={isLoading}
                >
                  <ArrowLeft size={18} />
                  Back
                </Button>
                <Button
                  onClick={handleSelectPlan}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : selectedPlan === 'free' ? (
                    <>
                      Continue with Free
                      <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 2 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">You&apos;re all set!</h2>
              <p className="text-text-secondary mb-8">
                Your organization is ready. Let&apos;s start scanning for accessibility issues.
              </p>
              <Button onClick={handleComplete} size="lg">
                Go to Dashboard
                <Rocket size={18} />
              </Button>
            </div>
          )}
        </Card>

        {/* Help Text */}
        <p className="text-center text-text-muted text-sm mt-8">
          Need help?{' '}
          <a href="/contact" className="text-primary hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

// Main export - choose based on Clerk configuration
export default function OnboardingPage() {
  // Use lazy initialization to determine if mock mode should be used
  const [useMock] = useState<boolean>(() => {
    // Check if Clerk is configured (client-side check)
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    return !clerkKey;
  });

  return useMock ? <MockOnboarding /> : <ClerkOnboarding />;
}
