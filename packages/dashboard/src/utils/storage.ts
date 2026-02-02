import type { SavedScan } from '../types';
import { STORAGE_KEYS, UI } from '../config';

export function loadAllScans(): SavedScan[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SCANS);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveScan(scan: SavedScan): void {
  const scans = loadAllScans();
  
  // Add new scan at beginning
  scans.unshift(scan);
  
  // Limit to UI.MAX_SCANS
  if (scans.length > UI.MAX_SCANS) {
    scans.splice(UI.MAX_SCANS);
  }
  
  localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(scans));
}

export function deleteScan(scanId: string): void {
  const scans = loadAllScans().filter(s => s.id !== scanId);
  localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(scans));
}

export function getScanById(scanId: string): SavedScan | undefined {
  return loadAllScans().find(s => s.id === scanId);
}

export function getScannedUrls(): string[] {
  const scans = loadAllScans();
  return [...new Set(scans.map(s => s.url))];
}

export function getScansForUrl(url: string): SavedScan[] {
  return loadAllScans()
    .filter(s => s.url === url)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}