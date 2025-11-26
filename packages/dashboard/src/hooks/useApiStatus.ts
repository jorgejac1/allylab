import { useState, useEffect, useCallback, useRef } from 'react';
import { getApiBase } from '../utils/api';

type ApiStatus = 'connected' | 'disconnected' | 'checking';

interface ApiHealth {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

async function fetchHealth(): Promise<{ ok: boolean; data: ApiHealth | null }> {
  try {
    const response = await fetch(`${getApiBase()}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      return { ok: true, data };
    }
    return { ok: false, data: null };
  } catch {
    return { ok: false, data: null };
  }
}

export function useApiStatus(checkInterval = 60000) { // Changed to 60 seconds
  const [status, setStatus] = useState<ApiStatus>('checking');
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const mountedRef = useRef(true);
  const hasInitialCheckRef = useRef(false);

  const checkHealth = useCallback(async () => {
    setStatus('checking');
    
    const result = await fetchHealth();
    
    if (!mountedRef.current) return;

    if (result.ok && result.data) {
      setHealth(result.data);
      setStatus('connected');
    } else {
      setStatus('disconnected');
      setHealth(null);
    }
    
    setLastChecked(new Date());
  }, []);

  // Setup mount tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initial check - only run once
  useEffect(() => {
    if (hasInitialCheckRef.current) return;
    hasInitialCheckRef.current = true;
    
    let cancelled = false;
    
    const doCheck = async () => {
      setStatus('checking');
      const result = await fetchHealth();
      
      if (cancelled) return;
      
      if (result.ok && result.data) {
        setHealth(result.data);
        setStatus('connected');
      } else {
        setStatus('disconnected');
        setHealth(null);
      }
      setLastChecked(new Date());
    };
    
    doCheck();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // Periodic health check - skip if interval is 0 or less
  useEffect(() => {
    if (checkInterval <= 0) return;
    
    const interval = setInterval(() => {
      fetchHealth().then(result => {
        if (!mountedRef.current) return;
        
        if (result.ok && result.data) {
          setHealth(result.data);
          setStatus('connected');
        } else {
          setStatus('disconnected');
          setHealth(null);
        }
        setLastChecked(new Date());
      });
    }, checkInterval);
    
    return () => clearInterval(interval);
  }, [checkInterval]);

  return {
    status,
    health,
    lastChecked,
    checkHealth,
  };
}