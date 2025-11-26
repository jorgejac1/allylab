import type { DateRange, DateRangeOption } from '../types';

// Helper to get date range bounds from option
export function getDateRangeBounds(
  option: DateRangeOption,
  customRange: DateRange
): DateRange {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (option) {
    case '7days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfDay };
    }
    case '30days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfDay };
    }
    case '90days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfDay };
    }
    case 'custom':
      return customRange;
    default:
      return { start: null, end: null };
  }
}

// Helper to format date range label
export function formatDateRangeLabel(option: DateRangeOption, customRange: DateRange): string {
  switch (option) {
    case '7days':
      return 'Last 7 days';
    case '30days':
      return 'Last 30 days';
    case '90days':
      return 'Last 90 days';
    case 'custom':
      if (customRange.start && customRange.end) {
        return `${customRange.start.toLocaleDateString()} - ${customRange.end.toLocaleDateString()}`;
      }
      return 'Custom range';
    default:
      return '';
  }
}

// Helper to format date for input element
export function formatDateForInput(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}