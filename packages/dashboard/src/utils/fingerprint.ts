import type { Finding } from '../types';

// DJB2 hash function
function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function generateFingerprint(finding: Finding): string {
  const key = `${finding.ruleId}|${finding.selector}|${finding.html.slice(0, 100)}`;
  return djb2Hash(key);
}

export function generateFindingId(finding: Finding, index: number): string {
  return `${finding.ruleId}-${index}-${generateFingerprint(finding).slice(0, 6)}`;
}