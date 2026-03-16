import { useState } from 'react';
import { Card, Button, Input, Select, EmptyState } from '../ui';
import { useSchedules } from '../../hooks';
import { PermissionGuard } from '../guards/RoleGuard';
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
        <div className="p-10 text-center text-slate-500">
          Loading schedules...
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Create New Schedule */}
      <Card>
        <h3 className="text-base font-semibold mt-0 mb-4 inline-flex items-center gap-2">
          <Plus size={18} /> Add Scheduled Scan
        </h3>

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[250px]">
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
          <PermissionGuard permission="scan:schedule">
            <Button onClick={handleCreate} disabled={isCreating || !newUrl.trim()} className="inline-flex items-center gap-1.5">
              {isCreating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><Plus size={14} /> Add Schedule</>}
            </Button>
          </PermissionGuard>
        </div>
      </Card>

      {/* Schedules List */}
      <Card>
        <h3 className="text-base font-semibold mt-0 mb-4 inline-flex items-center gap-2">
          <Calendar size={18} /> Scheduled Scans ({schedules.length})
        </h3>

        {schedules.length === 0 ? (
          <EmptyState
            icon={<Calendar size={32} />}
            title="No Scheduled Scans"
            description="Add a URL above to start monitoring automatically"
          />
        ) : (
          <div className="flex flex-col gap-3">
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
      className="flex items-center gap-4 p-4 rounded-lg border border-slate-200"
      style={{
        background: schedule.enabled ? '#f8fafc' : '#fafafa',
        opacity: schedule.enabled ? 1 : 0.7,
      }}
    >
      {/* Enable Toggle */}
      <label className="cursor-pointer">
        <input
          type="checkbox"
          checked={schedule.enabled}
          onChange={onToggle}
          className="w-[18px] h-[18px]"
        />
      </label>

      {/* Site Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold">{domain}</span>
          {authProfile && (
            <span className="py-0.5 px-1.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium inline-flex items-center gap-1">
              <Lock size={10} />
              {authProfile.name}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 break-all">
          {schedule.url}
        </div>
        {schedule.lastRun && (
          <div className="text-[11px] text-slate-400 mt-1">
            Last run: {new Date(schedule.lastRun).toLocaleString()}
            {schedule.lastScore !== undefined && (
              <span className="ml-2">
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
      <div className="w-[120px] text-center">
        {schedule.nextRun && schedule.enabled ? (
          <div>
            <div className="text-[11px] text-slate-500">Next run</div>
            <div className="text-xs font-medium">
              {formatFutureTime(schedule.nextRun)}
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400">&mdash;</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRunNow}
          disabled={isRunning}
          className="inline-flex items-center gap-1"
        >
          {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Run
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
          className="text-red-500"
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
      className="fixed inset-0 flex items-center justify-center z-[1000]"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-[90%] max-w-[600px] max-h-[80vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold m-0 inline-flex items-center gap-2">
            <BarChart3 size={20} /> Scan History
          </h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-slate-500 inline-flex items-center"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          {schedule.url}
        </p>

        {history.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No scan history yet
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((run, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-lg"
                style={{ background: run.success ? '#f0fdf4' : '#fef2f2' }}
              >
                <span>{run.success ? <CheckCircle size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-red-500" />}</span>
                <div className="flex-1">
                  <div className="text-sm">
                    {new Date(run.timestamp).toLocaleString()}
                  </div>
                  {run.error && (
                    <div className="text-xs text-red-600">{run.error}</div>
                  )}
                </div>
                {run.success && (
                  <>
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: getScoreColor(run.score) }}>
                        {run.score}
                      </div>
                      <div className="text-[10px] text-slate-500">Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-500">
                        {run.totalIssues}
                      </div>
                      <div className="text-[10px] text-slate-500">Issues</div>
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
