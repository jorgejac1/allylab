import { useState } from 'react';
import { Button, Card } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { authConfig } from '../../config/auth';
import { CreditCard, Check, AlertCircle, ExternalLink, Zap, Users, BarChart3, Calendar, Loader2, Clock, ArrowDown } from 'lucide-react';
import type { Plan } from '../../types/auth';

const PLAN_DETAILS: Record<Plan, {
  name: string;
  price: { monthly: number; yearly: number };
  features: string[];
}> = {
  free: {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    features: [
      '10 scans per month',
      '5 pages per scan',
      'Basic WCAG testing',
      '1 team member',
    ],
  },
  pro: {
    name: 'Pro',
    price: { monthly: 49, yearly: 490 },
    features: [
      '100 scans per month',
      '25 pages per scan',
      'AI-powered fixes',
      'GitHub PR creation',
      'Scheduled scans',
      '5 team members',
    ],
  },
  team: {
    name: 'Team',
    price: { monthly: 149, yearly: 1490 },
    features: [
      '500 scans per month',
      '100 pages per scan',
      'Custom rules',
      'API access',
      'Priority support',
      '20 team members',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: { monthly: 0, yearly: 0 }, // Custom pricing
    features: [
      'Unlimited scans',
      'SSO / SAML',
      'Self-hosted option',
      'Unlimited team members',
      'Dedicated support',
      'Custom SLA',
    ],
  },
};

export function BillingSettings() {
  const { organization, can, isMockAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockPlan, setMockPlan] = useState<Plan | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // In mock mode, allow simulating plan changes
  const currentPlan = mockPlan || organization?.plan || 'team';
  const planDetails = PLAN_DETAILS[currentPlan];
  const canManageBilling = can('billing:manage');

  // Mock trial status for demo (Pro and Team plans show as trialing)
  const isTrialing = currentPlan !== 'free' && currentPlan !== 'enterprise';
  // Use lazy initialization to compute trial end date once on mount
  const [trialEndsAt] = useState<Date | null>(() =>
    isTrialing ? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) : null
  );

  const handleManageBilling = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isMockAuth) {
        // Mock mode - show demo message
        await new Promise(resolve => setTimeout(resolve, 500));
        setSuccessMessage('In production, this opens the Stripe billing portal where you can update payment methods, view invoices, and cancel your subscription.');
        setIsLoading(false);
        return;
      }

      // Redirect to billing portal
      window.location.href = `${authConfig.websiteUrl}/api/billing/portal?return_url=${encodeURIComponent(window.location.href)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'pro' | 'team') => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isMockAuth) {
        // Mock: simulate the upgrade
        await new Promise(resolve => setTimeout(resolve, 800));
        setMockPlan(plan);
        setSuccessMessage(`Successfully upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)}! This is a demo - no actual charges were made.`);
        setIsLoading(false);
        return;
      }

      // Redirect to checkout
      window.location.href = `${authConfig.websiteUrl}/api/billing/checkout?plan=${plan}&interval=monthly`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setIsLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!isMockAuth) return;

    setIsLoading(true);
    setSuccessMessage(null);

    await new Promise(resolve => setTimeout(resolve, 500));
    setMockPlan('free');
    setSuccessMessage('Successfully downgraded to Free plan. This is a demo - your actual plan remains unchanged.');
    setIsLoading(false);
  };

  // Mock usage data (in production, this would come from the API)
  const usage = {
    scansUsed: 42,
    scansLimit: organization?.settings.maxScansPerMonth || 10,
    aiFixesUsed: 18,
    aiFixesLimit: organization?.settings.maxAiFixesPerMonth || 10,
    prsCreated: 7,
    prsLimit: organization?.settings.maxGitHubPRsPerMonth || 5,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Current Plan */}
      <Card>
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="m-0 text-base font-semibold flex items-center gap-2">
              <CreditCard size={18} /> Current Plan
            </h3>
            <p className="mt-1 mb-0 text-sm text-slate-500">
              Manage your subscription and billing
            </p>
          </div>
          {canManageBilling && currentPlan !== 'free' && (
            <Button
              variant="secondary"
              onClick={handleManageBilling}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ExternalLink size={14} />
              )}
              Manage Billing
            </Button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4 flex items-center gap-2">
            <Check size={16} /> {successMessage}
          </div>
        )}

        {/* Demo Mode Banner */}
        {isMockAuth && (
          <div className="p-3 bg-amber-100 border border-amber-200 rounded-lg text-amber-800 text-sm mb-4">
            <strong>Demo Mode:</strong> Billing actions are simulated. No real charges will be made.
          </div>
        )}

        {/* Trial Banner */}
        {trialEndsAt && currentPlan !== 'free' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm mb-4 flex items-center gap-2">
            <Clock size={16} />
            <span>
              Your trial ends on <strong>{trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.
              Add a payment method to continue using {planDetails.name} features.
            </span>
          </div>
        )}

        {/* Plan Card */}
        <div
          className="p-5 border rounded-xl"
          style={{
            background: currentPlan === 'free' ? '#f8fafc' : '#f0fdf4',
            borderColor: currentPlan === 'free' ? '#e2e8f0' : '#bbf7d0',
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <span
                className="text-2xl font-bold"
                style={{ color: currentPlan === 'free' ? '#475569' : '#15803d' }}
              >
                {planDetails.name}
              </span>
              {currentPlan !== 'free' && currentPlan !== 'enterprise' && (
                <span className="text-sm text-slate-500 ml-2">
                  ${planDetails.price.monthly}/month
                </span>
              )}
            </div>
            {currentPlan !== 'free' && (
              <span className="py-1 px-3 bg-green-100 text-green-700 rounded-full text-xs font-medium inline-flex items-center gap-1">
                <Check size={12} /> Active
              </span>
            )}
          </div>

          <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 gap-2">
            {planDetails.features.map((feature, i) => (
              <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                <Check size={14} className="text-green-500" />
                {feature}
              </li>
            ))}
          </ul>

          {/* Downgrade option in mock mode for paid plans */}
          {isMockAuth && currentPlan !== 'free' && canManageBilling && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <Button
                variant="secondary"
                onClick={handleDowngrade}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5"
              >
                <ArrowDown size={14} />
                Downgrade to Free (Demo)
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <h3 className="mt-0 mb-4 text-base font-semibold flex items-center gap-2">
          <BarChart3 size={18} /> Usage This Month
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UsageCard
            label="Scans"
            used={usage.scansUsed}
            limit={usage.scansLimit}
            icon={<Zap size={16} />}
          />
          <UsageCard
            label="AI Fixes"
            used={usage.aiFixesUsed}
            limit={usage.aiFixesLimit}
            icon={<BarChart3 size={16} />}
          />
          <UsageCard
            label="GitHub PRs"
            used={usage.prsCreated}
            limit={usage.prsLimit}
            icon={<Calendar size={16} />}
          />
        </div>

        <p className="mt-4 mb-0 text-xs text-slate-400">
          Usage resets on the 1st of each month
        </p>
      </Card>

      {/* Upgrade Options */}
      {currentPlan === 'free' && (
        <Card>
          <h3 className="mt-0 mb-4 text-base font-semibold flex items-center gap-2">
            <Zap size={18} /> Upgrade Your Plan
          </h3>
          <p className="mt-0 mb-5 text-sm text-slate-500">
            Unlock more scans, AI fixes, and team features.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pro Plan */}
            <div className="p-5 border-2 border-green-500 rounded-xl bg-white">
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-semibold">Pro</span>
                <span className="py-0.5 px-2 bg-green-100 text-green-700 rounded-xl text-[11px] font-medium">
                  Popular
                </span>
              </div>
              <div className="mb-4">
                <span className="text-[28px] font-bold">$49</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="m-0 mb-4 p-0 list-none flex flex-col gap-1.5">
                {PLAN_DETAILS.pro.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-center gap-1.5">
                    <Check size={12} className="text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => handleUpgrade('pro')} disabled={isLoading} className="w-full">
                Upgrade to Pro
              </Button>
            </div>

            {/* Team Plan */}
            <div className="p-5 border border-slate-200 rounded-xl bg-white">
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-semibold flex items-center gap-1.5">
                  <Users size={18} /> Team
                </span>
              </div>
              <div className="mb-4">
                <span className="text-[28px] font-bold">$149</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="m-0 mb-4 p-0 list-none flex flex-col gap-1.5">
                {PLAN_DETAILS.team.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-center gap-1.5">
                    <Check size={12} className="text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="secondary" onClick={() => handleUpgrade('team')} disabled={isLoading} className="w-full">
                Upgrade to Team
              </Button>
            </div>
          </div>

          <p className="mt-5 mb-0 text-sm text-slate-500 text-center">
            Need more? <a href={`${authConfig.websiteUrl}/contact`} className="text-blue-500">Contact us</a> for Enterprise pricing.
          </p>
        </Card>
      )}

      {/* Plan Comparison Link */}
      <div className="text-center">
        <a
          href={`${authConfig.websiteUrl}/pricing`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 text-sm no-underline"
        >
          Compare all plans <ExternalLink size={14} className="align-middle" />
        </a>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

interface UsageCardProps {
  label: string;
  used: number;
  limit: number;
  icon: React.ReactNode;
}

function UsageCard({ label, used, limit, icon }: UsageCardProps) {
  const percentage = limit === -1 ? 0 : Math.min((used / limit) * 100, 100);
  const isUnlimited = limit === -1;
  const isWarning = percentage > 80 && !isUnlimited;
  const isExceeded = percentage >= 100 && !isUnlimited;

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-slate-500">{icon}</span>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>

      <div className="mb-2">
        <span className="text-2xl font-bold">{used}</span>
        <span className="text-sm text-slate-400">
          {isUnlimited ? ' used' : ` / ${limit}`}
        </span>
      </div>

      {!isUnlimited && (
        <div className="h-1.5 bg-slate-200 rounded-sm overflow-hidden">
          <div
            className="h-full rounded-sm transition-[width] duration-300 ease-in-out"
            style={{
              width: `${percentage}%`,
              background: isExceeded ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e',
            }}
          />
        </div>
      )}
    </div>
  );
}
