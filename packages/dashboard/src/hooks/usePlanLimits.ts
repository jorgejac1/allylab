import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts';
import { getMonthlyUsage, incrementUsage } from '../utils/usageTracking';

export function usePlanLimits() {
  const { organization } = useAuth();
  const [usage, setUsage] = useState(() => getMonthlyUsage());

  const settings = organization?.settings;

  const isWithinLimit = useCallback((limit: number, current: number): boolean => {
    if (limit === -1) return true; // -1 means unlimited
    return current < limit;
  }, []);

  const canScan = useMemo(() => {
    if (!settings) return true;
    return isWithinLimit(settings.maxScansPerMonth, usage.scans);
  }, [settings, usage.scans, isWithinLimit]);

  const canGenerateFix = useMemo(() => {
    if (!settings) return true;
    return isWithinLimit(settings.maxAiFixesPerMonth, usage.aiFixes);
  }, [settings, usage.aiFixes, isWithinLimit]);

  const canCreatePR = useMemo(() => {
    if (!settings) return true;
    return isWithinLimit(settings.maxGitHubPRsPerMonth, usage.prs);
  }, [settings, usage.prs, isWithinLimit]);

  const canUseSchedules = useMemo(() => {
    if (!settings) return true;
    return settings.scheduledScans;
  }, [settings]);

  const canUseCustomRules = useMemo(() => {
    if (!settings) return true;
    return settings.maxCustomRules === -1 || settings.maxCustomRules > 0;
  }, [settings]);

  const canUseJira = useMemo(() => {
    if (!settings) return true;
    return settings.jiraIntegration;
  }, [settings]);

  const canUseSSO = useMemo(() => {
    if (!settings) return false;
    return settings.ssoEnabled;
  }, [settings]);

  const canExport = useCallback((format: string): boolean => {
    if (!settings) return true;
    return settings.exportFormats.includes(format as 'csv' | 'pdf' | 'excel' | 'json');
  }, [settings]);

  const remainingScans = useMemo(() => {
    if (!settings || settings.maxScansPerMonth === -1) return Infinity;
    return Math.max(0, settings.maxScansPerMonth - usage.scans);
  }, [settings, usage.scans]);

  const remainingFixes = useMemo(() => {
    if (!settings || settings.maxAiFixesPerMonth === -1) return Infinity;
    return Math.max(0, settings.maxAiFixesPerMonth - usage.aiFixes);
  }, [settings, usage.aiFixes]);

  const remainingPRs = useMemo(() => {
    if (!settings || settings.maxGitHubPRsPerMonth === -1) return Infinity;
    return Math.max(0, settings.maxGitHubPRsPerMonth - usage.prs);
  }, [settings, usage.prs]);

  const incrementScanCount = useCallback(() => {
    incrementUsage('scans');
    setUsage(getMonthlyUsage());
  }, []);

  const incrementFixCount = useCallback(() => {
    incrementUsage('aiFixes');
    setUsage(getMonthlyUsage());
  }, []);

  const incrementPRCount = useCallback(() => {
    incrementUsage('prs');
    setUsage(getMonthlyUsage());
  }, []);

  const plan = organization?.plan || 'free';

  return {
    plan,
    canScan,
    canGenerateFix,
    canCreatePR,
    canUseSchedules,
    canUseCustomRules,
    canUseJira,
    canUseSSO,
    canExport,
    remainingScans,
    remainingFixes,
    remainingPRs,
    incrementScanCount,
    incrementFixCount,
    incrementPRCount,
  };
}
