import { memo } from 'react';
import type { TrackingStats as TrackingStatsType } from '../../types';
import { BadgePlus, RefreshCw, CheckCircle } from 'lucide-react';

interface TrackingStatsProps {
  stats: TrackingStatsType;
}

export const TrackingStats = memo(function TrackingStats({ stats }: TrackingStatsProps) {
  return (
    <div className="flex gap-4 py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center gap-2">
        <BadgePlus size={18} className="text-blue-700" />
        <span className="font-bold text-blue-700">{stats.new}</span>
        <span className="text-[13px] text-slate-500">New</span>
      </div>
      <div className="flex items-center gap-2">
        <RefreshCw size={18} className="text-amber-700" />
        <span className="font-bold text-amber-700">{stats.recurring}</span>
        <span className="text-[13px] text-slate-500">Recurring</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle size={18} className="text-green-700" />
        <span className="font-bold text-green-700">{stats.fixed}</span>
        <span className="text-[13px] text-slate-500">Fixed</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="font-bold">{stats.total}</span>
        <span className="text-[13px] text-slate-500">Total Tracked</span>
      </div>
    </div>
  );
});
