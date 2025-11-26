import { useState } from 'react';
import { Card, Button, Input, Select, EmptyState } from '../ui';
import { useSchedules } from '../../hooks';
import type { Schedule, ScheduleFrequency, ScheduleRunResult } from '../../types';

const FREQUENCY_OPTIONS = [
  { value: 'hourly', label: 'Every Hour' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function ScheduleManager() {
  const { 
    schedules, 
    isLoading, 
    error, 
    createSchedule, 
    updateSchedule, 
    deleteSchedule,
    runNow,
    getHistory,
  } = useSchedules();

  const [newUrl, setNewUrl] = useState('');
  const [newFrequency, setNewFrequency] = useState<ScheduleFrequency>('daily');
  const [isCreating, setIsCreating] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [historyModal, setHistoryModal] = useState<{ schedule: Schedule; history: ScheduleRunResult[] } | null>(null);

  const handleCreate = async () => {
    if (!newUrl.trim()) return;

    setIsCreating(true);
    const result = await createSchedule(newUrl.trim(), newFrequency);
    setIsCreating(false);

    if (result) {
      setNewUrl('');
    }
  };

  const handleToggleEnabled = async (schedule: Schedule) => {
    await updateSchedule(schedule.id, { enabled: !schedule.enabled });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      await deleteSchedule(id);
    }
  };

  const handleRunNow = async (id: string) => {
    setRunningId(id);
    await runNow(id);
    setRunningId(null);
  };

  const handleViewHistory = async (schedule: Schedule) => {
    const history = await getHistory(schedule.id);
    setHistoryModal({ schedule, history });
  };

  if (isLoading) {
    return (
      <Card>
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          Loading schedules...
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Error Display */}
      {error && (
        <div style={{ 
          padding: 12, 
          background: '#fef2f2', 
          border: '1px solid #fecaca',
          borderRadius: 8,
          color: '#dc2626',
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {/* Create New Schedule */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          ➕ Add Scheduled Scan
        </h3>
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <Input
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div style={{ width: 150 }}>
            <Select
              value={newFrequency}
              onChange={e => setNewFrequency(e.target.value as ScheduleFrequency)}
              options={FREQUENCY_OPTIONS}
            />
          </div>
          <Button onClick={handleCreate} disabled={isCreating || !newUrl.trim()}>
            {isCreating ? '⏳ Creating...' : '+ Add Schedule'}
          </Button>
        </div>
      </Card>

      {/* Schedules List */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          📅 Scheduled Scans ({schedules.length})
        </h3>

        {schedules.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No Scheduled Scans"
            description="Add a URL above to start monitoring automatically"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {schedules.map(schedule => (
              <ScheduleRow
                key={schedule.id}
                schedule={schedule}
                isRunning={runningId === schedule.id}
                onToggle={() => handleToggleEnabled(schedule)}
                onDelete={() => handleDelete(schedule.id)}
                onRunNow={() => handleRunNow(schedule.id)}
                onViewHistory={() => handleViewHistory(schedule)}
                onUpdateFrequency={(frequency) => updateSchedule(schedule.id, { frequency })}
              />
            ))}
          </div>
        )}
      </Card>

      {/* History Modal */}
      {historyModal && (
        <HistoryModal
          schedule={historyModal.schedule}
          history={historyModal.history}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  );
}

// ============================================
// Schedule Row Component
// ============================================

interface ScheduleRowProps {
  schedule: Schedule;
  isRunning: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onRunNow: () => void;
  onViewHistory: () => void;
  onUpdateFrequency: (frequency: ScheduleFrequency) => void;
}

function ScheduleRow({
  schedule,
  isRunning,
  onToggle,
  onDelete,
  onRunNow,
  onViewHistory,
  onUpdateFrequency,
}: ScheduleRowProps) {
  const domain = new URL(schedule.url).hostname;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        background: schedule.enabled ? '#f8fafc' : '#fafafa',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        opacity: schedule.enabled ? 1 : 0.7,
      }}
    >
      {/* Enable Toggle */}
      <label style={{ cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={schedule.enabled}
          onChange={onToggle}
          style={{ width: 18, height: 18 }}
        />
      </label>

      {/* Site Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{domain}</div>
        <div style={{ fontSize: 12, color: '#64748b', wordBreak: 'break-all' }}>
          {schedule.url}
        </div>
        {schedule.lastRun && (
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            Last run: {new Date(schedule.lastRun).toLocaleString()}
            {schedule.lastScore !== undefined && (
              <span style={{ marginLeft: 8 }}>
                Score: <strong style={{ color: getScoreColor(schedule.lastScore) }}>{schedule.lastScore}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Frequency Selector */}
      <div style={{ width: 120 }}>
        <Select
          value={schedule.frequency}
          onChange={e => onUpdateFrequency(e.target.value as ScheduleFrequency)}
          options={FREQUENCY_OPTIONS}
          disabled={!schedule.enabled}
        />
      </div>

      {/* Next Run */}
      <div style={{ width: 120, textAlign: 'center' }}>
        {schedule.nextRun && schedule.enabled ? (
          <div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Next run</div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>
              {formatNextRun(schedule.nextRun)}
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRunNow}
          disabled={isRunning}
        >
          {isRunning ? '⏳' : '▶️'} Run
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewHistory}
          title="View history"
        >
          📊
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          title="Delete schedule"
          style={{ color: '#ef4444' }}
        >
          🗑️
        </Button>
      </div>
    </div>
  );
}

// ============================================
// History Modal Component
// ============================================

interface HistoryModalProps {
  schedule: Schedule;
  history: ScheduleRunResult[];
  onClose: () => void;
}

function HistoryModal({ schedule, history, onClose }: HistoryModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          width: '90%',
          maxWidth: 600,
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            📊 Scan History
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
          {schedule.url}
        </p>

        {history.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            No scan history yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((run, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 12,
                  background: run.success ? '#f0fdf4' : '#fef2f2',
                  borderRadius: 8,
                }}
              >
                <span>{run.success ? '✅' : '❌'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>
                    {new Date(run.timestamp).toLocaleString()}
                  </div>
                  {run.error && (
                    <div style={{ fontSize: 12, color: '#dc2626' }}>{run.error}</div>
                  )}
                </div>
                {run.success && (
                  <>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: getScoreColor(run.score) }}>
                        {run.score}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Score</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#64748b' }}>
                        {run.totalIssues}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Issues</div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 70) return '#f59e0b';
  if (score >= 50) return '#ea580c';
  return '#dc2626';
}

function formatNextRun(nextRun: string): string {
  const date = new Date(nextRun);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}