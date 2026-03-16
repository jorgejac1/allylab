/**
 * GitLab MR Tracking Utilities
 *
 * Storage utilities for tracking GitLab Merge Requests
 * created through the AllyLab dashboard.
 */

import { STORAGE_KEYS } from '../config';
import type { GitLabMRTracking } from '../types/gitlab';

/**
 * Track a new GitLab MR by appending it to localStorage.
 */
export function trackMR(mr: Omit<GitLabMRTracking, 'id'>): GitLabMRTracking {
  const tracked: GitLabMRTracking = {
    ...mr,
    id: `mr_${mr.mrIid}_${Date.now()}`,
  };

  const existing = getTrackedMRs();
  existing.push(tracked);

  try {
    localStorage.setItem(STORAGE_KEYS.TRACKED_MRS_GITLAB, JSON.stringify(existing));
  } catch (err) {
    console.error('[gitlabTracking] Failed to save MR tracking:', err);
  }

  return tracked;
}

/**
 * Get all tracked GitLab MRs from localStorage.
 */
export function getTrackedMRs(): GitLabMRTracking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRACKED_MRS_GITLAB);
    if (!raw) return [];
    return JSON.parse(raw) as GitLabMRTracking[];
  } catch (err) {
    console.error('[gitlabTracking] Failed to read tracked MRs:', err);
    return [];
  }
}

/**
 * Update the status of a tracked MR identified by mrIid and projectPath.
 */
export function updateMRStatus(
  mrIid: number,
  projectPath: string,
  status: GitLabMRTracking['status']
): void {
  const tracked = getTrackedMRs();
  const updated = tracked.map((mr) =>
    mr.mrIid === mrIid && mr.projectPath === projectPath
      ? { ...mr, status }
      : mr
  );

  try {
    localStorage.setItem(STORAGE_KEYS.TRACKED_MRS_GITLAB, JSON.stringify(updated));
  } catch (err) {
    console.error('[gitlabTracking] Failed to update MR status:', err);
  }
}

/**
 * Update the verification status of a tracked MR by its id.
 */
export function updateMRVerification(
  id: string,
  verificationStatus: 'verified' | 'failed',
  verifiedAt: string
): void {
  const mrs = getTrackedMRs();
  const updated = mrs.map(mr =>
    mr.id === id ? { ...mr, verificationStatus, verifiedAt } : mr
  );

  try {
    localStorage.setItem(STORAGE_KEYS.TRACKED_MRS_GITLAB, JSON.stringify(updated));
  } catch (err) {
    console.error('[gitlabTracking] Failed to update MR verification:', err);
  }
}

/**
 * Find the MR tracking entry that includes a given findingId.
 */
export function getMRForFinding(findingId: string): GitLabMRTracking | undefined {
  const tracked = getTrackedMRs();
  return tracked.find((mr) => mr.findingIds.includes(findingId));
}
