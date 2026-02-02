const SEARCH_TYPE_KEY = 'allylab-search-type';

export function getLastSearchType(domain: string): string | null {
  try {
    const saved = localStorage.getItem(SEARCH_TYPE_KEY);
    if (saved) {
      const mapping = JSON.parse(saved);
      return mapping[domain] || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function saveSearchType(domain: string, type: string): void {
  try {
    const saved = localStorage.getItem(SEARCH_TYPE_KEY);
    const mapping = saved ? JSON.parse(saved) : {};
    mapping[domain] = type;
    localStorage.setItem(SEARCH_TYPE_KEY, JSON.stringify(mapping));
  } catch {
    // Ignore storage errors
  }
}
