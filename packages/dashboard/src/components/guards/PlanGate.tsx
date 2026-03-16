import type { ReactNode } from 'react';
import { usePlanLimits } from '../../hooks';
import { UpgradePrompt } from './UpgradePrompt';

interface PlanGateProps {
  feature: 'scan' | 'ai-fix' | 'pr' | 'schedules' | 'custom-rules' | 'jira' | 'export-pdf' | 'sso';
  children: ReactNode;
  fallback?: ReactNode;
}

export function PlanGate({ feature, children, fallback }: PlanGateProps) {
  const limits = usePlanLimits();

  const isAllowed = (() => {
    switch (feature) {
      case 'scan': return limits.canScan;
      case 'ai-fix': return limits.canGenerateFix;
      case 'pr': return limits.canCreatePR;
      case 'schedules': return limits.canUseSchedules;
      case 'custom-rules': return limits.canUseCustomRules;
      case 'jira': return limits.canUseJira;
      case 'export-pdf': return limits.canExport('pdf');
      case 'sso': return limits.canUseSSO;
      default: return true;
    }
  })();

  if (!isAllowed) {
    return <>{fallback || <UpgradePrompt feature={feature} />}</>;
  }

  return <>{children}</>;
}
