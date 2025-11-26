import type { Finding, TrackedFinding, IssueStatus, TrackingStats } from '../types';
import { generateFingerprint } from './fingerprint';
import { loadAllScans } from './storage';

interface TrackedIssue {
  fingerprint: string;
  ruleId: string;
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
}

const TRACKER_KEY = 'allylab_tracked_issues';

function loadTrackedIssues(): Map<string, TrackedIssue> {
  try {
    const data = localStorage.getItem(TRACKER_KEY);
    if (!data) return new Map();
    const arr: TrackedIssue[] = JSON.parse(data);
    return new Map(arr.map(i => [i.fingerprint, i]));
  } catch {
    return new Map();
  }
}

function saveTrackedIssues(issues: Map<string, TrackedIssue>): void {
  localStorage.setItem(TRACKER_KEY, JSON.stringify([...issues.values()]));
}

export function trackFindings(findings: Finding[], scanTimestamp: string): TrackedFinding[] {
  const tracked = loadTrackedIssues();
  const currentFingerprints = new Set<string>();
  
  const trackedFindings: TrackedFinding[] = findings.map(finding => {
    const fingerprint = generateFingerprint(finding);
    currentFingerprints.add(fingerprint);
    
    const existing = tracked.get(fingerprint);
    let status: IssueStatus;
    
    if (existing) {
      status = 'recurring';
      existing.lastSeen = scanTimestamp;
      existing.occurrences++;
    } else {
      status = 'new';
      tracked.set(fingerprint, {
        fingerprint,
        ruleId: finding.ruleId,
        firstSeen: scanTimestamp,
        lastSeen: scanTimestamp,
        occurrences: 1,
      });
    }
    
    return {
      ...finding,
      fingerprint,
      status,
      firstSeen: existing?.firstSeen || scanTimestamp,
      lastSeen: scanTimestamp,
    };
  });
  
  saveTrackedIssues(tracked);
  return trackedFindings;
}

export function getTrackingStats(trackedFindings: TrackedFinding[]): TrackingStats {
  const stats: TrackingStats = { new: 0, recurring: 0, fixed: 0, total: 0 };
  
  for (const finding of trackedFindings) {
    stats[finding.status]++;
    stats.total++;
  }
  
  return stats;
}

export function getPreviousFingerprints(url: string): Set<string> {
  const scans = loadAllScans().filter(s => s.url === url);
  const fingerprints = new Set<string>();
  
  for (const scan of scans) {
    if (scan.trackedFindings) {
      for (const f of scan.trackedFindings) {
        fingerprints.add(f.fingerprint);
      }
    }
  }
  
  return fingerprints;
}