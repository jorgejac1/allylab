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

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Split by double newline (SSE event separator)
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || ''; // Keep incomplete chunk in buffer

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          
          // Parse SSE format: "event: type\ndata: {...}"
          const lines = chunk.split('\n');
          let eventType = '';
          let dataStr = '';
          
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataStr = line.slice(5).trim();
            }
          }
          
          if (!eventType || !dataStr) {
            console.log('[useSiteScan] Skipping incomplete chunk:', chunk);
            continue;
          }
          
          try {
            const data = JSON.parse(dataStr);
            console.log('[useSiteScan] Event:', eventType, data);
            
            switch (eventType) {
              case 'status':
                if (data.phase === 'crawl') setPhase('crawling');
                if (data.phase === 'scan') setPhase('scanning');
                break;
                
              case 'crawl-complete':
                setDiscoveredUrls(data.urls || []);
                setTotalPages(data.totalFound || 0);
                break;
                
              case 'page-start':
                setCurrentPage(data.index || 0);
                break;
                
              case 'page-complete':
                setResults(prev => [...prev, data as PageResult]);
                break;
                
              case 'complete':
                setPhase('complete');
                setSummary(data as SiteScanResult);
                break;
                
              case 'error':
                setPhase('error');
                setError(data.message || 'Unknown error');
                break;
                
              default:
                console.log('[useSiteScan] Unknown event type:', eventType);
            }
          } catch (parseError) {
            console.error('[useSiteScan] Failed to parse SSE data:', parseError, dataStr);
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      console.error('[useSiteScan] Scan failed:', message);
      setPhase('error');
      setError(message);
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