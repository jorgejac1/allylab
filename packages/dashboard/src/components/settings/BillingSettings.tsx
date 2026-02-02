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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Current Plan */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} /> Current Plan
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Manage your subscription and billing
            </p>
          </div>
          {canManageBilling && currentPlan !== 'free' && (
            <Button
              variant="secondary"
              onClick={handleManageBilling}
              disabled={isLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {isLoading ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <ExternalLink size={14} />
              )}
              Manage Billing
            </Button>
          )}
        </div>

        {error && (
          <div style={{
            padding: 12,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#dc2626',
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {successMessage && (
          <div style={{
            padding: 12,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            color: '#15803d',
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Check size={16} /> {successMessage}
          </div>
        )}

        {/* Demo Mode Banner */}
        {isMockAuth && (
          <div style={{
            padding: 12,
            background: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: 8,
            color: '#92400e',
            fontSize: 13,
            marginBottom: 16,
          }}>
            <strong>Demo Mode:</strong> Billing actions are simulated. No real charges will be made.
          </div>
        )}

        {/* Trial Banner */}
        {trialEndsAt && currentPlan !== 'free' && (
          <div style={{
            padding: 12,
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            color: '#1e40af',
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Clock size={16} />
            <span>
              Your trial ends on <strong>{trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.
              Add a payment method to continue using {planDetails.name} features.
            </span>
          </div>
        )}

        {/* Plan Card */}
        <div style={{
          padding: 20,
          background: currentPlan === 'free' ? '#f8fafc' : '#f0fdf4',
          border: '1px solid',
          borderColor: currentPlan === 'free' ? '#e2e8f0' : '#bbf7d0',
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <span style={{
                fontSize: 24,
                fontWeight: 700,
                color: currentPlan === 'free' ? '#475569' : '#15803d',
              }}>
                {planDetails.name}
              </span>
              {currentPlan !== 'free' && currentPlan !== 'enterprise' && (
                <span style={{ fontSize: 14, color: '#64748b', marginLeft: 8 }}>
                  ${planDetails.price.monthly}/month
                </span>
              )}
            </div>
            {currentPlan !== 'free' && (
              <span style={{
                padding: '4px 12px',
                background: '#dcfce7',
                color: '#15803d',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <Check size={12} /> Active
              </span>
            )}
          </div>

          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {planDetails.features.map((feature, i) => (
              <li key={i} style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={14} style={{ color: '#22c55e' }} />
                {feature}
              </li>
            ))}
          </ul>

          {/* Downgrade option in mock mode for paid plans */}
          {isMockAuth && currentPlan !== 'free' && canManageBilling && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <Button
                variant="secondary"
                onClick={handleDowngrade}
                disabled={isLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
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
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={18} /> Usage This Month
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
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

        <p style={{ margin: '16px 0 0', fontSize: 12, color: '#94a3b8' }}>
          Usage resets on the 1st of each month
        </p>
      </Card>

      {/* Upgrade Options */}
      {currentPlan === 'free' && (
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} /> Upgrade Your Plan
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#64748b' }}>
            Unlock more scans, AI fixes, and team features.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {/* Pro Plan */}
            <div style={{
              padding: 20,
              border: '2px solid #22c55e',
              borderRadius: 12,
              background: 'white',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 600 }}>Pro</span>
                <span style={{
                  padding: '2px 8px',
                  background: '#dcfce7',
                  color: '#15803d',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 500,
                }}>
                  Popular
                </span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 700 }}>$49</span>
                <span style={{ color: '#64748b' }}>/month</span>
              </div>
              <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PLAN_DETAILS.pro.features.slice(0, 4).map((f, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={12} style={{ color: '#22c55e' }} /> {f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => handleUpgrade('pro')} disabled={isLoading} style={{ width: '100%' }}>
                Upgrade to Pro
              </Button>
            </div>

            {/* Team Plan */}
            <div style={{
              padding: 20,
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              background: 'white',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={18} /> Team
                </span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 700 }}>$149</span>
                <span style={{ color: '#64748b' }}>/month</span>
              </div>
              <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PLAN_DETAILS.team.features.slice(0, 4).map((f, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={12} style={{ color: '#22c55e' }} /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="secondary" onClick={() => handleUpgrade('team')} disabled={isLoading} style={{ width: '100%' }}>
                Upgrade to Team
              </Button>
            </div>
          </div>

          <p style={{ margin: '20px 0 0', fontSize: 13, color: '#64748b', textAlign: 'center' }}>
            Need more? <a href={`${authConfig.websiteUrl}/contact`} style={{ color: '#3b82f6' }}>Contact us</a> for Enterprise pricing.
          </p>
        </Card>
      )}

      {/* Plan Comparison Link */}
      <div style={{ textAlign: 'center' }}>
        <a
          href={`${authConfig.websiteUrl}/pricing`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none' }}
        >
          Compare all plans <ExternalLink size={14} style={{ verticalAlign: 'middle' }} />
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
    <div style={{
      padding: 16,
      background: '#f8fafc',
      borderRadius: 8,
      border: '1px solid #e2e8f0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ color: '#64748b' }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>{label}</span>
      </div>

      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 700 }}>{used}</span>
        <span style={{ fontSize: 14, color: '#94a3b8' }}>
          {isUnlimited ? ' used' : ` / ${limit}`}
        </span>
      </div>

      {!isUnlimited && (
        <div style={{
          height: 6,
          background: '#e2e8f0',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${percentage}%`,
            background: isExceeded ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e',
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}
    </div>
  );
}
