import type { SavedScan, WCAGStandard, Viewport } from '../types';

export function performRescan(
  currentScan: SavedScan | null,
  handleScan: (url: string, options: { standard: WCAGStandard; viewport: Viewport }) => void
): boolean {
  if (!currentScan) return false;
  handleScan(currentScan.url, { standard: 'wcag21aa', viewport: 'desktop' });
  return true;
}
