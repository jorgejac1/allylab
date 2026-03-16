import { STORAGE_KEYS } from '../config';

interface MonthlyUsage {
  scans: number;
  aiFixes: number;
  prs: number;
  month: string; // YYYY-MM format
}

const DEFAULT_USAGE: MonthlyUsage = { scans: 0, aiFixes: 0, prs: 0, month: '' };

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function getMonthlyUsage(): MonthlyUsage {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USAGE_TRACKING);
    if (!raw) return { ...DEFAULT_USAGE, month: getCurrentMonth() };
    const usage: MonthlyUsage = JSON.parse(raw);
    // Reset if new month
    if (usage.month !== getCurrentMonth()) {
      const fresh = { ...DEFAULT_USAGE, month: getCurrentMonth() };
      localStorage.setItem(STORAGE_KEYS.USAGE_TRACKING, JSON.stringify(fresh));
      return fresh;
    }
    return usage;
  } catch {
    return { ...DEFAULT_USAGE, month: getCurrentMonth() };
  }
}

export function incrementUsage(type: 'scans' | 'aiFixes' | 'prs'): void {
  const usage = getMonthlyUsage();
  usage[type]++;
  localStorage.setItem(STORAGE_KEYS.USAGE_TRACKING, JSON.stringify(usage));
}

export function resetMonthlyCounters(): void {
  const fresh = { ...DEFAULT_USAGE, month: getCurrentMonth() };
  localStorage.setItem(STORAGE_KEYS.USAGE_TRACKING, JSON.stringify(fresh));
}
