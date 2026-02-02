import { memo } from 'react';
import type { TrackingStats as TrackingStatsType } from '../../types';
import { BadgePlus, RefreshCw, CheckCircle } from 'lucide-react';

interface TrackingStatsProps {
  stats: TrackingStatsType;
}

export const TrackingStats = memo(function TrackingStats({ stats }: TrackingStatsProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 16,
      padding: '12px 16px',
      background: '#f8fafc',
      borderRadius: 8,
      border: '1px solid #e2e8f0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BadgePlus size={18} style={{ color: '#1d4ed8' }} />
        <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{stats.new}</span>
        <span style={{ fontSize: 13, color: '#64748b' }}>New</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <RefreshCw size={18} style={{ color: '#b45309' }} />
        <span style={{ fontWeight: 700, color: '#b45309' }}>{stats.recurring}</span>
        <span style={{ fontSize: 13, color: '#64748b' }}>Recurring</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckCircle size={18} style={{ color: '#15803d' }} />
        <span style={{ fontWeight: 700, color: '#15803d' }}>{stats.fixed}</span>
        <span style={{ fontSize: 13, color: '#64748b' }}>Fixed</span>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700 }}>{stats.total}</span>
        <span style={{ fontSize: 13, color: '#64748b' }}>Total Tracked</span>
      </div>
    </div>
  );
});