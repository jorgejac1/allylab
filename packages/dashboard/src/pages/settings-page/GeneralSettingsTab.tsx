import { Search, HardDrive, AlertTriangle, Trash2, Check } from 'lucide-react';
import { Card, Button, Input, Select, SettingRow } from '../../components/ui';
import { WCAG_OPTIONS } from './constants';
import type { Settings, WCAGStandard } from './types';

interface GeneralSettingsTabProps {
  settings: Settings;
  saved: boolean;
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onSave: () => void;
  onReset: () => void;
  onClearData: () => void;
}

export function GeneralSettingsTab({
  settings,
  saved,
  onChange,
  onSave,
  onReset,
  onClearData,
}: GeneralSettingsTabProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Scanning Settings */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={18} aria-hidden="true" />
          Scanning Preferences
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SettingRow label="Default WCAG Standard">
            <Select
              value={settings.defaultStandard}
              onChange={(e) => onChange('defaultStandard', e.target.value as WCAGStandard)}
              options={WCAG_OPTIONS}
              style={{ width: 250 }}
            />
          </SettingRow>

          <SettingRow label="Include Warnings">
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={settings.includeWarnings}
                onChange={(e) => onChange('includeWarnings', e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 14, color: '#64748b' }}>
                Show potential issues that need manual review
              </span>
            </label>
          </SettingRow>
        </div>
      </Card>

      {/* Storage Settings */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <HardDrive size={18} aria-hidden="true" />
          Storage Settings
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SettingRow label="Auto-save Scans">
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => onChange('autoSave', e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 14, color: '#64748b' }}>
                Automatically save scan results to history
              </span>
            </label>
          </SettingRow>

          <SettingRow label="Max Scans Stored">
            <Input
              type="number"
              value={settings.maxScansStored}
              onChange={(e) => onChange('maxScansStored', parseInt(e.target.value) || 100)}
              min={10}
              max={500}
              style={{ width: 100 }}
            />
          </SettingRow>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card style={{ borderColor: '#fecaca' }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: '0 0 16px',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={18} aria-hidden="true" />
          Danger Zone
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            Clear all stored scan data and issue tracking history. This action cannot be undone.
          </p>
          <Button variant="danger" onClick={onClearData}>
            <Trash2 size={14} aria-hidden="true" style={{ marginRight: 6 }} />
            Clear All Data
          </Button>
        </div>
      </Card>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onReset}>
          Reset to Defaults
        </Button>
        <Button onClick={onSave}>
          {saved ? <><Check size={14} aria-hidden="true" style={{ marginRight: 6 }} />Saved!</> : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
