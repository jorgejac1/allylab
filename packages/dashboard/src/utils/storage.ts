import type { SavedScan } from '../types';

const STORAGE_KEY = 'allylab_scans';
const MAX_SCANS = 100;

export function loadAllScans(): SavedScan[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
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
  
  // Limit to MAX_SCANS
  if (scans.length > MAX_SCANS) {
    scans.splice(MAX_SCANS);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
}

export function deleteScan(scanId: string): void {
  const scans = loadAllScans().filter(s => s.id !== scanId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
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