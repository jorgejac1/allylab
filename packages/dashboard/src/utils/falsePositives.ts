import type { FalsePositiveEntry, TrackedFinding } from '../types';

const STORAGE_KEY = 'allylab_false_positives';

/**
 * Load all false positive entries from localStorage
 */
export function loadFalsePositives(): FalsePositiveEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save false positive entries to localStorage
 */
function saveFalsePositives(entries: FalsePositiveEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * Mark a finding as false positive
 */
export function markAsFalsePositive(
  fingerprint: string,
  ruleId: string,
  reason?: string
): void {
  const entries = loadFalsePositives();
  
  // Check if already exists
  const existingIndex = entries.findIndex(e => e.fingerprint === fingerprint);
  
  const entry: FalsePositiveEntry = {
    fingerprint,
    ruleId,
    reason,
    markedAt: new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  saveFalsePositives(entries);
}

/**
 * Unmark a finding as false positive
 */
export function unmarkFalsePositive(fingerprint: string): void {
  const entries = loadFalsePositives();
  const filtered = entries.filter(e => e.fingerprint !== fingerprint);
  saveFalsePositives(filtered);
}

/**
 * Check if a finding is marked as false positive
 */
export function isFalsePositive(fingerprint: string): boolean {
  const entries = loadFalsePositives();
  return entries.some(e => e.fingerprint === fingerprint);
}

/**
 * Get false positive entry for a fingerprint
 */
export function getFalsePositiveEntry(fingerprint: string): FalsePositiveEntry | undefined {
  const entries = loadFalsePositives();
  return entries.find(e => e.fingerprint === fingerprint);
}

/**
 * Apply false positive status to findings
 */
export function applyFalsePositiveStatus(findings: TrackedFinding[]): TrackedFinding[] {
  const entries = loadFalsePositives();
  const fpMap = new Map(entries.map(e => [e.fingerprint, e]));
  
  return findings.map(finding => {
    const fpEntry = fpMap.get(finding.fingerprint);
    if (fpEntry) {
      return {
        ...finding,
        falsePositive: true,
        falsePositiveReason: fpEntry.reason,
        falsePositiveMarkedAt: fpEntry.markedAt,
      };
    }
    return { ...finding, falsePositive: false };
  });
}

/**
 * Get count of false positives
 */
export function getFalsePositiveCount(): number {
  return loadFalsePositives().length;
}

/**
 * Clear all false positives
 */
export function clearAllFalsePositives(): void {
  localStorage.removeItem(STORAGE_KEY);
}