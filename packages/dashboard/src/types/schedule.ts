export type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface Schedule {
  id: string;
  url: string;
  frequency: ScheduleFrequency;
  enabled: boolean;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
  lastScore?: number;
  lastIssues?: number;
}

export interface ScheduleRunResult {
  scheduleId: string;
  url: string;
  score: number;
  totalIssues: number;
  timestamp: string;
  success: boolean;
  error?: string;
}