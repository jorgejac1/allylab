import type { Schedule, ScheduleFrequency, ScheduleRunResult } from '../types/schedule.js';
import { runScan } from './scanner.js';

// In-memory storage (replace with DB later)
const schedules = new Map<string, Schedule>();
const scheduledJobs = new Map<string, NodeJS.Timeout>();
const runHistory = new Map<string, ScheduleRunResult[]>();

// Generate unique ID
function generateId(): string {
  return `sch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Calculate next run time
function calculateNextRun(frequency: ScheduleFrequency): Date {
  const now = new Date();
  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

// Get interval in milliseconds
function getIntervalMs(frequency: ScheduleFrequency): number {
  switch (frequency) {
    case 'hourly':
      return 60 * 60 * 1000;
    case 'daily':
      return 24 * 60 * 60 * 1000;
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000;
    case 'monthly':
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

// Run a scheduled scan
async function runScheduledScan(schedule: Schedule): Promise<ScheduleRunResult> {
  console.log(`[Scheduler] Running scan for ${schedule.url}`);
  
  const result: ScheduleRunResult = {
    scheduleId: schedule.id,
    url: schedule.url,
    score: 0,
    totalIssues: 0,
    timestamp: new Date().toISOString(),
    success: false,
  };

  try {
    const scanResult = await runScan({
        url: schedule.url,
        viewport: 'desktop',
        standard: 'wcag21aa',
    });

    result.score = scanResult.score;
    result.totalIssues = scanResult.totalIssues;
    result.success = true;

    // Update schedule with last run info
    schedule.lastRun = result.timestamp;
    schedule.lastScore = result.score;
    schedule.lastIssues = result.totalIssues;
    schedule.nextRun = calculateNextRun(schedule.frequency).toISOString();
    schedules.set(schedule.id, schedule);

    console.log(`[Scheduler] Scan complete: ${schedule.url} - Score: ${result.score}`);
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Scheduler] Scan failed: ${schedule.url}`, error);
  }

  // Store in history
  const history = runHistory.get(schedule.id) || [];
  history.unshift(result);
  runHistory.set(schedule.id, history.slice(0, 50)); // Keep last 50 runs

  return result;
}

// Start a scheduled job
function startJob(schedule: Schedule): void {
  if (!schedule.enabled) return;

  // Clear existing job if any
  stopJob(schedule.id);

  const intervalMs = getIntervalMs(schedule.frequency);
  
  // Run immediately on first start, then at interval
  const job = setInterval(() => {
    const currentSchedule = schedules.get(schedule.id);
    if (currentSchedule && currentSchedule.enabled) {
      runScheduledScan(currentSchedule);
    }
  }, intervalMs);

  scheduledJobs.set(schedule.id, job);
  console.log(`[Scheduler] Started job ${schedule.id} for ${schedule.url} (${schedule.frequency})`);
}

// Stop a scheduled job
function stopJob(scheduleId: string): void {
  const job = scheduledJobs.get(scheduleId);
  if (job) {
    clearInterval(job);
    scheduledJobs.delete(scheduleId);
    console.log(`[Scheduler] Stopped job ${scheduleId}`);
  }
}

// ============================================
// Public API
// ============================================

export function getAllSchedules(): Schedule[] {
  return Array.from(schedules.values());
}

export function getScheduleById(id: string): Schedule | undefined {
  return schedules.get(id);
}

export function createSchedule(url: string, frequency: ScheduleFrequency): Schedule {
  const schedule: Schedule = {
    id: generateId(),
    url,
    frequency,
    enabled: true,
    createdAt: new Date().toISOString(),
    nextRun: calculateNextRun(frequency).toISOString(),
  };

  schedules.set(schedule.id, schedule);
  startJob(schedule);

  return schedule;
}

export function updateSchedule(
  id: string, 
  updates: { frequency?: ScheduleFrequency; enabled?: boolean }
): Schedule | null {
  const schedule = schedules.get(id);
  if (!schedule) return null;

  if (updates.frequency !== undefined) {
    schedule.frequency = updates.frequency;
    schedule.nextRun = calculateNextRun(updates.frequency).toISOString();
  }

  if (updates.enabled !== undefined) {
    schedule.enabled = updates.enabled;
    
    if (updates.enabled) {
      startJob(schedule);
    } else {
      stopJob(id);
    }
  }

  schedules.set(id, schedule);
  return schedule;
}

export function deleteSchedule(id: string): boolean {
  stopJob(id);
  runHistory.delete(id);
  return schedules.delete(id);
}

export function getScheduleHistory(id: string): ScheduleRunResult[] {
  return runHistory.get(id) || [];
}

export async function runScheduleNow(id: string): Promise<ScheduleRunResult | null> {
  const schedule = schedules.get(id);
  if (!schedule) return null;

  return runScheduledScan(schedule);
}

// Initialize scheduler (call on server start)
export function initScheduler(): void {
  console.log('[Scheduler] Initializing...');
  // Restart all enabled jobs
  for (const schedule of schedules.values()) {
    if (schedule.enabled) {
      startJob(schedule);
    }
  }
  console.log(`[Scheduler] Initialized with ${schedules.size} schedules`);
}

// Shutdown scheduler (call on server stop)
export function shutdownScheduler(): void {
  console.log('[Scheduler] Shutting down...');
  for (const id of scheduledJobs.keys()) {
    stopJob(id);
  }
  console.log('[Scheduler] Shutdown complete');
}