import { Button } from '../../ui';
import { formatDateForInput } from '../../../utils/dateRange';
import type { DateRange } from '../../../types';
import { X } from 'lucide-react';

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateChange: (field: 'start' | 'end', value: string) => void;
  onClear: () => void;
}

export function DateRangePicker({ dateRange, onDateChange, onClear }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <span className="text-sm text-slate-500 font-medium">
        Date Range:
      </span>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={formatDateForInput(dateRange.start)}
          onChange={e => onDateChange('start', e.target.value)}
          className="py-2 px-3 border border-slate-200 rounded-md text-sm"
        />
        <span className="text-slate-500">to</span>
        <input
          type="date"
          value={formatDateForInput(dateRange.end)}
          onChange={e => onDateChange('end', e.target.value)}
          className="py-2 px-3 border border-slate-200 rounded-md text-sm"
        />
      </div>
      {dateRange.start && dateRange.end && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-slate-500 inline-flex items-center gap-1"
        >
          <X size={12} /> Clear
        </Button>
      )}
    </div>
  );
}
