import { Button } from '../../ui';
import { formatDateForInput } from '../../../utils/dateRange';
import type { DateRange } from '../../../types';

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateChange: (field: 'start' | 'end', value: string) => void;
  onClear: () => void;
}

export function DateRangePicker({ dateRange, onDateChange, onClear }: DateRangePickerProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        background: '#f8fafc',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
      }}
    >
      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
        Date Range:
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="date"
          value={formatDateForInput(dateRange.start)}
          onChange={e => onDateChange('start', e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <span style={{ color: '#64748b' }}>to</span>
        <input
          type="date"
          value={formatDateForInput(dateRange.end)}
          onChange={e => onDateChange('end', e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 13,
          }}
        />
      </div>
      {dateRange.start && dateRange.end && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          style={{ color: '#64748b' }}
        >
          ✕ Clear
        </Button>
      )}
    </div>
  );
}