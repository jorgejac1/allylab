import { Zap } from 'lucide-react';

const FEATURE_LABELS: Record<string, { label: string; plan: string }> = {
  'scan': { label: 'Scan limit reached', plan: 'Pro' },
  'ai-fix': { label: 'AI fix limit reached', plan: 'Pro' },
  'pr': { label: 'PR creation limit reached', plan: 'Pro' },
  'schedules': { label: 'Scheduled scans', plan: 'Pro' },
  'custom-rules': { label: 'Custom rules', plan: 'Team' },
  'jira': { label: 'JIRA integration', plan: 'Pro' },
  'export-pdf': { label: 'PDF/Excel export', plan: 'Pro' },
  'sso': { label: 'SSO / SAML authentication', plan: 'Enterprise' },
};

interface UpgradePromptProps {
  feature: string;
}

export function UpgradePrompt({ feature }: UpgradePromptProps) {
  const info = FEATURE_LABELS[feature] || { label: 'This feature', plan: 'Pro' };

  return (
    <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
      <Zap size={16} className="text-amber-500 shrink-0" />
      <div>
        <span className="font-medium text-amber-800">{info.label}</span>
        <span className="text-amber-600"> — Upgrade to {info.plan} to unlock.</span>
      </div>
    </div>
  );
}
