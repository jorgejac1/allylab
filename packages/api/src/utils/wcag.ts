const WCAG_TAG_MAP: Record<string, string[]> = {
  wcag2a: ['wcag2a', 'wcag21a', 'best-practice'],
  wcag2aa: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
  wcag2aaa: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa', 'best-practice'],
  wcag21a: ['wcag2a', 'wcag21a', 'best-practice'],
  wcag21aa: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
  wcag22aa: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
};

export function getWcagTags(standard: string): string[] {
  return WCAG_TAG_MAP[standard] || WCAG_TAG_MAP['wcag21aa'];
}

export function getWcagLevel(tags: string[]): string {
  if (tags.some(t => t.match(/wcag\d*aaa/))) return 'AAA';
  if (tags.some(t => t.match(/wcag\d*aa/))) return 'AA';
  if (tags.some(t => t.match(/wcag\d+a(?!a)/))) return 'A';
  return 'Best Practice';
}

export function getWcagVersion(tags: string[]): string {
  if (tags.some(t => t.includes('wcag22'))) return '2.2';
  if (tags.some(t => t.includes('wcag21'))) return '2.1';
  if (tags.some(t => t.includes('wcag2'))) return '2.0';
  return 'N/A';
}

export function resolveWcagTags(tags: string[] | undefined | null): string[] {
  if (!tags) return [];
  if (!Array.isArray(tags)) return [];
  return tags;
}