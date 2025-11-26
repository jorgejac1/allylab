import { useState } from 'react';
import type { ScanResult } from '../types';

export function useScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = async (url: string): Promise<ScanResult | null> => {
    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch('/api/scan/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Scan failed');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  return { scan, isScanning, error };
}