import { useState, useEffect, useCallback } from 'react';
import type { Schedule, ScheduleFrequency, ScheduleRunResult } from '../types';
import { getApiBase } from '../utils/api';

interface UseSchedulesReturn {
  schedules: Schedule[];
  isLoading: boolean;
  error: string | null;
  createSchedule: (url: string, frequency: ScheduleFrequency) => Promise<Schedule | null>;
  updateSchedule: (id: string, updates: { frequency?: ScheduleFrequency; enabled?: boolean }) => Promise<Schedule | null>;
  deleteSchedule: (id: string) => Promise<boolean>;
  runNow: (id: string) => Promise<ScheduleRunResult | null>;
  getHistory: (id: string) => Promise<ScheduleRunResult[]>;
  refresh: () => Promise<void>;
}

export function useSchedules(): UseSchedulesReturn {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${getApiBase()}/schedules`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      
      const data = await response.json();
      setSchedules(data.schedules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const createSchedule = useCallback(async (url: string, frequency: ScheduleFrequency): Promise<Schedule | null> => {
    try {
      const response = await fetch(`${getApiBase()}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, frequency }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create schedule');
      }

      const schedule = await response.json();
      setSchedules(prev => [...prev, schedule]);
      return schedule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  const updateSchedule = useCallback(async (
    id: string, 
    updates: { frequency?: ScheduleFrequency; enabled?: boolean }
  ): Promise<Schedule | null> => {
    try {
      const response = await fetch(`${getApiBase()}/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update schedule');
      }

      const schedule = await response.json();
      setSchedules(prev => prev.map(s => s.id === id ? schedule : s));
      return schedule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  const deleteSchedule = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${getApiBase()}/schedules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete schedule');
      }

      setSchedules(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  const runNow = useCallback(async (id: string): Promise<ScheduleRunResult | null> => {
    try {
      const response = await fetch(`${getApiBase()}/schedules/${id}/run`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to run schedule');
      }

      const result = await response.json();
      
      // Refresh schedules to get updated lastRun info
      await fetchSchedules();
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [fetchSchedules]);

  const getHistory = useCallback(async (id: string): Promise<ScheduleRunResult[]> => {
    try {
      const response = await fetch(`${getApiBase()}/schedules/${id}/history`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get history');
      }

      const data = await response.json();
      return data.history;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    }
  }, []);

  return {
    schedules,
    isLoading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    runNow,
    getHistory,
    refresh: fetchSchedules,
  };
}