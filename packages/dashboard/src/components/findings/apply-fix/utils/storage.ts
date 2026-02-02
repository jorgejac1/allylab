// localStorage key for remembering repo per domain
const REPO_STORAGE_KEY = 'allylab-domain-repos';

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function getSavedRepo(domain: string): { owner: string; repo: string } | null {
  try {
    const saved = localStorage.getItem(REPO_STORAGE_KEY);
    if (saved) {
      const mapping = JSON.parse(saved);
      return mapping[domain] || null;
    }
  } catch (e) {
    console.error('[ApplyFixModal] Failed to load saved repo:', e);
  }
  return null;
}

export function saveRepoForDomain(domain: string, owner: string, repo: string): void {
  try {
    const saved = localStorage.getItem(REPO_STORAGE_KEY);
    const mapping = saved ? JSON.parse(saved) : {};
    mapping[domain] = { owner, repo };
    localStorage.setItem(REPO_STORAGE_KEY, JSON.stringify(mapping));
  } catch (e) {
    console.error('[ApplyFixModal] Failed to save repo:', e);
  }
}
