import { useMemo } from 'react';

export type PresetPeriod = 'week' | 'month' | 'quarter' | 'custom';

export interface DateRanges {
  period1Start: string;
  period1End: string;
  period2Start: string;
  period2End: string;
}

export function useDateRanges(preset: PresetPeriod): DateRanges {
  return useMemo(() => {
    const now = new Date();
    let period1Start: Date;
    let period1End: Date;
    let period2Start: Date;
    let period2End: Date;

    switch (preset) {
      case 'week':
        period2End = now;
        period2Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        period1End = new Date(period2Start.getTime() - 1);
        period1Start = new Date(period1End.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        period2End = now;
        period2Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        period1End = new Date(period2Start.getTime() - 1);
        period1Start = new Date(
          period1End.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        break;
      case 'quarter':
        period2End = now;
        period2Start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        period1End = new Date(period2Start.getTime() - 1);
        period1Start = new Date(
          period1End.getTime() - 90 * 24 * 60 * 60 * 1000
        );
        break;
      default:
        period2End = now;
        period2Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        period1End = new Date(period2Start.getTime() - 1);
        period1Start = new Date(
          period1End.getTime() - 30 * 24 * 60 * 60 * 1000
        );
    }

    return {
      period1Start: period1Start.toISOString(),
      period1End: period1End.toISOString(),
      period2Start: period2Start.toISOString(),
      period2End: period2End.toISOString(),
    };
  }, [preset]);
}

export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  return `${startDate.toLocaleDateString(
    'en-US',
    options
  )} - ${endDate.toLocaleDateString('en-US', options)}`;
}
