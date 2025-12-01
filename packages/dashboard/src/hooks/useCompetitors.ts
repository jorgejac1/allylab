import { useState, useEffect, useCallback } from 'react';
import type { Competitor, CompetitorScan, BenchmarkData } from '../types';
import { getApiBase } from '../utils/api';

const STORAGE_KEY = 'allylab_competitors';
const SCANS_KEY = 'allylab_competitor_scans';

export function useCompetitors(yourSiteUrl?: string, yourSiteScore?: number) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [scans, setScans] = useState<CompetitorScan[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setCompetitors(JSON.parse(stored));
    }

    const storedScans = localStorage.getItem(SCANS_KEY);
    if (storedScans) {
      setScans(JSON.parse(storedScans));
    }
  }, []);

  // Save competitors to localStorage
  const saveCompetitors = useCallback((updated: Competitor[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCompetitors(updated);
  }, []);

  // Save scans to localStorage
  const saveScans = useCallback((updater: (prev: CompetitorScan[]) => CompetitorScan[]) => {
    setScans(prev => {
      const updated = updater(prev);
      localStorage.setItem(SCANS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Add competitor
  const addCompetitor = useCallback((url: string, name?: string) => {
    const domain = new URL(url).hostname;
    const competitor: Competitor = {
      id: `comp_${Date.now()}`,
      url,
      name: name || domain,
      enabled: true,
    };

    saveCompetitors([...competitors, competitor]);
    return competitor;
  }, [competitors, saveCompetitors]);

  // Remove competitor
  const removeCompetitor = useCallback((id: string) => {
    saveCompetitors(competitors.filter(c => c.id !== id));
    saveScans(prev => prev.filter(s => s.competitorId !== id));
  }, [competitors, saveCompetitors, saveScans]);

  // Update competitor
  const updateCompetitor = useCallback((id: string, updates: Partial<Competitor>) => {
    saveCompetitors(competitors.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  }, [competitors, saveCompetitors]);

  // Scan a single competitor
  const scanCompetitor = useCallback(async (competitor: Competitor): Promise<CompetitorScan | null> => {
    setScanningId(competitor.id);
    
    try {
      const response = await fetch(`${getApiBase()}/scan/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: competitor.url,
          standard: 'wcag21aa',
          viewport: 'desktop',
        }),
      });

      if (!response.ok) {
        throw new Error('Scan failed');
      }

      const result = await response.json();

      const scan: CompetitorScan = {
        competitorId: competitor.id,
        url: competitor.url,
        name: competitor.name,
        score: result.score,
        totalIssues: result.totalIssues,
        critical: result.critical,
        serious: result.serious,
        moderate: result.moderate,
        minor: result.minor,
        scannedAt: new Date().toISOString(),
      };

      // Update competitor with latest score
      updateCompetitor(competitor.id, {
        lastScore: result.score,
        lastScanned: scan.scannedAt,
      });

      // Add to scans history (keep latest per competitor)
      saveScans(prev => [
        scan,
        ...prev.filter(s => s.competitorId !== competitor.id),
      ]);

      return scan;
    } catch (error) {
      console.error('Failed to scan competitor:', error);
      return null;
    } finally {
      setScanningId(null);
    }
  }, [saveScans, updateCompetitor]);

  // Scan all enabled competitors
  const scanAll = useCallback(async () => {
    setIsScanning(true);
    const enabledCompetitors = competitors.filter(c => c.enabled);

    for (const competitor of enabledCompetitors) {
      await scanCompetitor(competitor);
      // Small delay between scans
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsScanning(false);
  }, [competitors, scanCompetitor]);

  // Get benchmark data
  const getBenchmarkData = useCallback((): BenchmarkData | null => {
    if (!yourSiteUrl || yourSiteScore === undefined) return null;

    const latestScans = competitors
      .filter(c => c.enabled && c.lastScore !== undefined)
      .map(c => scans.find(s => s.competitorId === c.id))
      .filter((s): s is CompetitorScan => s !== undefined);

    if (latestScans.length === 0) return null;

    const allScores = [yourSiteScore, ...latestScans.map(s => s.score)];
    const sortedScores = [...allScores].sort((a, b) => b - a);
    const yourRank = sortedScores.indexOf(yourSiteScore) + 1;

    const beating = latestScans.filter(s => yourSiteScore > s.score).length;
    const losingTo = latestScans.filter(s => yourSiteScore < s.score).length;

    return {
      yourSite: {
        url: yourSiteUrl,
        score: yourSiteScore,
        totalIssues: 0, // Would need to pass this in
        grade: getGrade(yourSiteScore),
      },
      competitors: latestScans,
      summary: {
        averageScore: Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length),
        yourRank,
        totalCompetitors: latestScans.length,
        beating,
        losingTo,
      },
    };
  }, [yourSiteUrl, yourSiteScore, competitors, scans]);

  return {
    competitors,
    scans,
    isScanning,
    scanningId,
    addCompetitor,
    removeCompetitor,
    updateCompetitor,
    scanCompetitor,
    scanAll,
    getBenchmarkData,
  };
}

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
