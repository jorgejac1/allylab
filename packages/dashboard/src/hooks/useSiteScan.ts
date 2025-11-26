import { useState, useCallback } from 'react';
import { getApiBase } from '../utils/api';

export interface PageResult {
  url: string;
  score: number;
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  scanTime: number;
}

export interface SiteScanResult {
  pagesScanned: number;
  averageScore: number;
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  results: PageResult[];
}

type ScanPhase = 'idle' | 'crawling' | 'scanning' | 'complete' | 'error';

export function useSiteScan() {
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [results, setResults] = useState<PageResult[]>([]);
  const [summary, setSummary] = useState<SiteScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScan = useCallback(async (
    url: string,
    maxPages: number = 10,
    maxDepth: number = 2,
    standard: string = 'wcag21aa'
  ) => {
    setPhase('crawling');
    setDiscoveredUrls([]);
    setCurrentPage(0);
    setTotalPages(0);
    setResults([]);
    setSummary(null);
    setError(null);

    try {
      const response = await fetch(`${getApiBase()}/crawl/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, maxPages, maxDepth, standard }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            
            switch (data.type) {
              case 'status':
                if (data.data.phase === 'crawl') setPhase('crawling');
                if (data.data.phase === 'scan') setPhase('scanning');
                break;
                
              case 'crawl-complete':
                setDiscoveredUrls(data.data.urls);
                setTotalPages(data.data.totalFound);
                break;
                
              case 'page-start':
                setCurrentPage(data.data.index);
                break;
                
              case 'page-complete':
                setResults(prev => [...prev, data.data]);
                break;
                
              case 'complete':
                setPhase('complete');
                setSummary(data.data);
                break;
                
              case 'error':
                setPhase('error');
                setError(data.data.message);
                break;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Scan failed');
    }
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setDiscoveredUrls([]);
    setCurrentPage(0);
    setTotalPages(0);
    setResults([]);
    setSummary(null);
    setError(null);
  }, []);

  return {
    phase,
    discoveredUrls,
    currentPage,
    totalPages,
    results,
    summary,
    error,
    startScan,
    reset,
    isScanning: phase === 'crawling' || phase === 'scanning',
  };
}