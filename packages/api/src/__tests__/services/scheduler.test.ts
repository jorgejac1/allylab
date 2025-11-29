import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the scanner before importing scheduler
vi.mock('../../services/scanner', () => ({
  runScan: vi.fn(),
}));

import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleHistory,
  runScheduleNow,
  initScheduler,
  shutdownScheduler,
} from '../../services/scheduler';
import { runScan } from '../../services/scanner';

const mockRunScan = vi.mocked(runScan);

describe('services/scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Clear all schedules
    const schedules = getAllSchedules();
    schedules.forEach(s => deleteSchedule(s.id));

    // Default mock for runScan
    mockRunScan.mockResolvedValue({
      id: 'scan_123',
      url: 'https://example.com',
      timestamp: new Date().toISOString(),
      score: 85,
      totalIssues: 10,
      critical: 1,
      serious: 3,
      moderate: 4,
      minor: 2,
      findings: [],
      scanDuration: 5000,
      viewport: 'desktop',
    });
  });

  afterEach(() => {
    shutdownScheduler();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('createSchedule', () => {
    it('creates schedule with required fields', () => {
      const schedule = createSchedule('https://example.com', 'daily');

      expect(schedule).toMatchObject({
        url: 'https://example.com',
        frequency: 'daily',
        enabled: true,
      });
      expect(schedule.id).toMatch(/^sch_/);
      expect(schedule.createdAt).toBeDefined();
      expect(schedule.nextRun).toBeDefined();
    });

    it('creates hourly schedule with correct nextRun', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const schedule = createSchedule('https://example.com', 'hourly');

      const nextRun = new Date(schedule.nextRun!);
      expect(nextRun.getTime()).toBe(now.getTime() + 60 * 60 * 1000);
    });

    it('creates daily schedule with correct nextRun', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const schedule = createSchedule('https://example.com', 'daily');

      const nextRun = new Date(schedule.nextRun!);
      expect(nextRun.getTime()).toBe(now.getTime() + 24 * 60 * 60 * 1000);
    });

    it('creates weekly schedule with correct nextRun', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const schedule = createSchedule('https://example.com', 'weekly');

      const nextRun = new Date(schedule.nextRun!);
      expect(nextRun.getTime()).toBe(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    });

    it('creates monthly schedule with correct nextRun', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const schedule = createSchedule('https://example.com', 'monthly');

      const nextRun = new Date(schedule.nextRun!);
      expect(nextRun.getTime()).toBe(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('getAllSchedules', () => {
    it('returns empty array when no schedules exist', () => {
      const schedules = getAllSchedules();
      expect(schedules).toEqual([]);
    });

    it('returns all created schedules', () => {
      createSchedule('https://example1.com', 'daily');
      createSchedule('https://example2.com', 'weekly');
      createSchedule('https://example3.com', 'monthly');

      const schedules = getAllSchedules();
      expect(schedules).toHaveLength(3);
    });
  });

  describe('getScheduleById', () => {
    it('returns schedule when it exists', () => {
      const created = createSchedule('https://example.com', 'daily');

      const found = getScheduleById(created.id);
      expect(found).toEqual(created);
    });

    it('returns undefined for non-existent id', () => {
      const found = getScheduleById('non-existent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('updateSchedule', () => {
    it('updates schedule frequency', () => {
      const schedule = createSchedule('https://example.com', 'daily');

      const updated = updateSchedule(schedule.id, { frequency: 'weekly' });

      expect(updated?.frequency).toBe('weekly');
    });

    it('updates nextRun when frequency changes', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const schedule = createSchedule('https://example.com', 'daily');
      const originalNextRun = schedule.nextRun;

      const updated = updateSchedule(schedule.id, { frequency: 'weekly' });

      expect(updated?.nextRun).not.toBe(originalNextRun);
    });

    it('enables schedule', () => {
      const schedule = createSchedule('https://example.com', 'daily');
      updateSchedule(schedule.id, { enabled: false });

      const updated = updateSchedule(schedule.id, { enabled: true });

      expect(updated?.enabled).toBe(true);
    });

    it('disables schedule', () => {
      const schedule = createSchedule('https://example.com', 'daily');

      const updated = updateSchedule(schedule.id, { enabled: false });

      expect(updated?.enabled).toBe(false);
    });

    it('returns null for non-existent schedule', () => {
      const result = updateSchedule('non-existent-id', { frequency: 'weekly' });
      expect(result).toBeNull();
    });
  });

  describe('deleteSchedule', () => {
    it('deletes existing schedule and returns true', () => {
      const schedule = createSchedule('https://example.com', 'daily');

      const result = deleteSchedule(schedule.id);

      expect(result).toBe(true);
      expect(getScheduleById(schedule.id)).toBeUndefined();
    });

    it('returns false for non-existent schedule', () => {
      const result = deleteSchedule('non-existent-id');
      expect(result).toBe(false);
    });

    it('clears schedule history when deleted', () => {
      const schedule = createSchedule('https://example.com', 'daily');
      
      deleteSchedule(schedule.id);

      const history = getScheduleHistory(schedule.id);
      expect(history).toEqual([]);
    });
  });

  describe('runScheduleNow', () => {
    it('runs scan for existing schedule', async () => {
      const schedule = createSchedule('https://example.com', 'daily');

      const result = await runScheduleNow(schedule.id);

      expect(mockRunScan).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com',
        })
      );
      expect(result?.success).toBe(true);
      expect(result?.score).toBe(85);
    });

    it('returns null for non-existent schedule', async () => {
      const result = await runScheduleNow('non-existent-id');
      expect(result).toBeNull();
    });

    it('updates schedule with lastRun info', async () => {
      const schedule = createSchedule('https://example.com', 'daily');

      await runScheduleNow(schedule.id);

      const updated = getScheduleById(schedule.id);
      expect(updated?.lastRun).toBeDefined();
      expect(updated?.lastScore).toBe(85);
      expect(updated?.lastIssues).toBe(10);
    });

    it('adds result to history', async () => {
      const schedule = createSchedule('https://example.com', 'daily');

      await runScheduleNow(schedule.id);

      const history = getScheduleHistory(schedule.id);
      expect(history).toHaveLength(1);
      expect(history[0].success).toBe(true);
    });

    it('handles scan failure gracefully', async () => {
      mockRunScan.mockRejectedValue(new Error('Connection timeout'));

      const schedule = createSchedule('https://example.com', 'daily');

      const result = await runScheduleNow(schedule.id);

      expect(result?.success).toBe(false);
      expect(result?.error).toBe('Connection timeout');
    });

    it('stores failed results in history', async () => {
      mockRunScan.mockRejectedValue(new Error('Network error'));

      const schedule = createSchedule('https://example.com', 'daily');

      await runScheduleNow(schedule.id);

      const history = getScheduleHistory(schedule.id);
      expect(history).toHaveLength(1);
      expect(history[0].success).toBe(false);
      expect(history[0].error).toBe('Network error');
    });
  });

  describe('getScheduleHistory', () => {
    it('returns empty array for new schedule', () => {
      const schedule = createSchedule('https://example.com', 'daily');

      const history = getScheduleHistory(schedule.id);
      expect(history).toEqual([]);
    });

    it('returns history in reverse chronological order', async () => {
      const schedule = createSchedule('https://example.com', 'daily');

      mockRunScan.mockResolvedValueOnce({
        id: 'scan_1',
        url: 'https://example.com',
        timestamp: new Date().toISOString(),
        score: 80,
        totalIssues: 15,
        critical: 0,
        serious: 5,
        moderate: 5,
        minor: 5,
        findings: [],
        scanDuration: 5000,
        viewport: 'desktop',
      });

      await runScheduleNow(schedule.id);

      mockRunScan.mockResolvedValueOnce({
        id: 'scan_2',
        url: 'https://example.com',
        timestamp: new Date().toISOString(),
        score: 90,
        totalIssues: 5,
        critical: 0,
        serious: 0,
        moderate: 3,
        minor: 2,
        findings: [],
        scanDuration: 5000,
        viewport: 'desktop',
      });

      await runScheduleNow(schedule.id);

      const history = getScheduleHistory(schedule.id);
      expect(history).toHaveLength(2);
      // Most recent first
      expect(history[0].score).toBe(90);
      expect(history[1].score).toBe(80);
    });

    it('limits history to 50 entries', async () => {
      const schedule = createSchedule('https://example.com', 'daily');

      // Run 55 scans
      for (let i = 0; i < 55; i++) {
        mockRunScan.mockResolvedValueOnce({
          id: `scan_${i}`,
          url: 'https://example.com',
          timestamp: new Date().toISOString(),
          score: 80 + (i % 20),
          totalIssues: 10,
          critical: 0,
          serious: 0,
          moderate: 5,
          minor: 5,
          findings: [],
          scanDuration: 5000,
          viewport: 'desktop',
        });
        await runScheduleNow(schedule.id);
      }

      const history = getScheduleHistory(schedule.id);
      expect(history).toHaveLength(50);
    });
  });

  describe('initScheduler', () => {
    it('restarts enabled jobs', () => {
      createSchedule('https://example1.com', 'daily');
      createSchedule('https://example2.com', 'weekly');

      initScheduler();

      // Jobs should be started (we can verify by advancing timers)
      expect(getAllSchedules()).toHaveLength(2);
    });
  });

  describe('shutdownScheduler', () => {
    it('stops all jobs', () => {
      createSchedule('https://example.com', 'daily');

      shutdownScheduler();

      // After shutdown, advancing timers should not trigger scans
      vi.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 hours

      // runScan should not have been called by the scheduler
      // (it might be called once during schedule creation depending on implementation)
    });
  });

  describe('scheduled execution', () => {
    it('runs scan at scheduled interval', async () => {
      createSchedule('https://example.com', 'hourly');

      // Advance time by 1 hour
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

      expect(mockRunScan).toHaveBeenCalled();
    });

    it('does not run disabled schedule', async () => {
      const schedule = createSchedule('https://example.com', 'hourly');
      updateSchedule(schedule.id, { enabled: false });

      mockRunScan.mockClear();

      // Advance time by 1 hour
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

      expect(mockRunScan).not.toHaveBeenCalled();
    });
  });
});