import { useState } from 'react';
import { Card, Button, Input, Select, EmptyState } from '../ui';
import { useSchedules } from '../../hooks';
import type { Schedule, ScheduleFrequency, ScheduleRunResult } from '../../types';
import type { AuthProfile } from '../../types/auth';
import { Plus, Loader2, Calendar, Play, BarChart3, Trash2, X, CheckCircle, XCircle, Lock } from 'lucide-react';
import { getScoreColor, formatFutureTime } from '../../utils/scoreUtils';
import { getAuthProfiles, getAuthProfile } from '../../utils/authProfiles';

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
  const [newAuthProfileId, setNewAuthProfileId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [historyModal, setHistoryModal] = useState<{ schedule: Schedule; history: ScheduleRunResult[] } | null>(null);

  // Use lazy initialization to load auth profiles
  const [authProfiles] = useState<AuthProfile[]>(() => getAuthProfiles().filter(p => p.enabled));

  const handleCreate = async () => {
    if (!newUrl.trim()) return;

    setIsCreating(true);
    const result = await createSchedule(newUrl.trim(), newFrequency, newAuthProfileId || undefined);
    setIsCreating(false);

    if (result) {
      setNewUrl('');
      setNewAuthProfileId('');
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
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Add Scheduled Scan
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
          {authProfiles.length > 0 && (
            <div style={{ width: 180 }}>
              <Select
                value={newAuthProfileId}
                onChange={e => setNewAuthProfileId(e.target.value)}
                options={[
                  { value: '', label: 'No Auth' },
                  ...authProfiles.map(p => ({ value: p.id, label: `🔐 ${p.name}` })),
                ]}
              />
            </div>
          )}
          <Button onClick={handleCreate} disabled={isCreating || !newUrl.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {isCreating ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : <><Plus size={14} /> Add Schedule</>}
          </Button>
        </div>
      </Card>

      {/* Schedules List */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} /> Scheduled Scans ({schedules.length})
        </h3>

        {schedules.length === 0 ? (
          <EmptyState
            icon={<Calendar size={32} />}
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
                authProfiles={authProfiles}
                onToggle={() => handleToggleEnabled(schedule)}
                onDelete={() => handleDelete(schedule.id)}
                onRunNow={() => handleRunNow(schedule.id)}
                onViewHistory={() => handleViewHistory(schedule)}
                onUpdateFrequency={(frequency) => updateSchedule(schedule.id, { frequency })}
                onUpdateAuthProfile={(authProfileId) => updateSchedule(schedule.id, { authProfileId })}
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
  authProfiles: AuthProfile[];
  onToggle: () => void;
  onDelete: () => void;
  onRunNow: () => void;
  onViewHistory: () => void;
  onUpdateFrequency: (frequency: ScheduleFrequency) => void;
  onUpdateAuthProfile: (authProfileId: string | null) => void;
}

function ScheduleRow({
  schedule,
  isRunning,
  authProfiles,
  onToggle,
  onDelete,
  onRunNow,
  onViewHistory,
  onUpdateFrequency,
  onUpdateAuthProfile,
}: ScheduleRowProps) {
  const domain = new URL(schedule.url).hostname;
  const authProfile = schedule.authProfileId ? getAuthProfile(schedule.authProfileId) : null;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 600 }}>{domain}</span>
          {authProfile && (
            <span style={{
              padding: '2px 6px',
              borderRadius: 4,
              background: '#eff6ff',
              color: '#1d4ed8',
              fontSize: 10,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <Lock size={10} />
              {authProfile.name}
            </span>
          )}
        </div>
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

      {/* Auth Profile Selector */}
      {authProfiles.length > 0 && (
        <div style={{ width: 130 }}>
          <Select
            value={schedule.authProfileId || ''}
            onChange={e => onUpdateAuthProfile(e.target.value || null)}
            options={[
              { value: '', label: 'No Auth' },
              ...authProfiles.map(p => ({ value: p.id, label: p.name })),
            ]}
            disabled={!schedule.enabled}
          />
        </div>
      )}

      {/* Next Run */}
      <div style={{ width: 120, textAlign: 'center' }}>
        {schedule.nextRun && schedule.enabled ? (
          <div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Next run</div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>
              {formatFutureTime(schedule.nextRun)}
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
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          {isRunning ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />} Run
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewHistory}
          title="View history"
          aria-label="View scan history"
        >
          <BarChart3 size={16} aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          title="Delete schedule"
          aria-label="Delete schedule"
          style={{ color: '#ef4444' }}
        >
          <Trash2 size={16} aria-hidden="true" />
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
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={20} /> Scan History
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
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
                <span>{run.success ? <CheckCircle size={18} style={{ color: '#10b981' }} /> : <XCircle size={18} style={{ color: '#ef4444' }} />}</span>
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