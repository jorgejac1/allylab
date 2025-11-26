import { useState, useEffect, useCallback } from 'react';

type ApiStatus = 'connected' | 'disconnected' | 'checking';

interface ApiHealth {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

export function useApiStatus(checkInterval = 30000) {
  const [status, setStatus] = useState<ApiStatus>('checking');
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setStatus('checking');
    
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setHealth(data);
        setStatus('connected');
      } else {
        setStatus('disconnected');
        setHealth(null);
      }
    } catch {
      setStatus('disconnected');
      setHealth(null);
    }

    setLastChecked(new Date());
  }, []);

  // Check on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Periodic health check
  useEffect(() => {
    const interval = setInterval(checkHealth, checkInterval);
    return () => clearInterval(interval);
  }, [checkHealth, checkInterval]);

  return {
    status,
    health,
    lastChecked,
    checkHealth,
  };
}