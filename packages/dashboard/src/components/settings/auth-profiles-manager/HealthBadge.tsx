import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { checkProfileHealth } from '../../../utils/authProfiles';
import type { AuthProfile } from './types';

interface HealthBadgeProps {
  profile: AuthProfile;
}

export function HealthBadge({ profile }: HealthBadgeProps) {
  const health = checkProfileHealth(profile);

  if (health.status === 'healthy') {
    return (
      <span
        className="py-0.5 px-1.5 rounded inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-medium"
        title={health.message}
      >
        <CheckCircle size={10} />
        Verified
      </span>
    );
  }

  if (health.status === 'warning') {
    return (
      <span
        className="py-0.5 px-1.5 rounded inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-medium"
        title={health.message}
      >
        <AlertTriangle size={10} />
        {health.daysSinceTest}d ago
      </span>
    );
  }

  if (health.status === 'expired') {
    return (
      <span
        className="py-0.5 px-1.5 rounded inline-flex items-center gap-1 bg-red-100 text-red-600 text-[10px] font-medium"
        title={health.message}
      >
        <XCircle size={10} />
        Needs Test
      </span>
    );
  }

  // untested
  return (
    <span
      className="py-0.5 px-1.5 rounded inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-medium"
      title={health.message}
    >
      <Clock size={10} />
      Untested
    </span>
  );
}
