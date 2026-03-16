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
    <div className="flex flex-col gap-6">
      {/* Scanning Settings */}
      <Card>
        <h3 className="text-base font-semibold m-0 mb-4 flex items-center gap-2">
          <Search size={18} aria-hidden="true" />
          Scanning Preferences
        </h3>

        <div className="flex flex-col gap-4">
          <SettingRow label="Default WCAG Standard">
            <Select
              value={settings.defaultStandard}
              onChange={(e) => onChange('defaultStandard', e.target.value as WCAGStandard)}
              options={WCAG_OPTIONS}
              className="w-[250px]"
            />
          </SettingRow>

          <SettingRow label="Include Warnings">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.includeWarnings}
                onChange={(e) => onChange('includeWarnings', e.target.checked)}
                className="w-[18px] h-[18px]"
              />
              <span className="text-sm text-slate-500">
                Show potential issues that need manual review
              </span>
            </label>
          </SettingRow>
        </div>
      </Card>

      {/* Storage Settings */}
      <Card>
        <h3 className="text-base font-semibold m-0 mb-4 flex items-center gap-2">
          <HardDrive size={18} aria-hidden="true" />
          Storage Settings
        </h3>

        <div className="flex flex-col gap-4">
          <SettingRow label="Auto-save Scans">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => onChange('autoSave', e.target.checked)}
                className="w-[18px] h-[18px]"
              />
              <span className="text-sm text-slate-500">
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
              className="w-[100px]"
            />
          </SettingRow>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <h3 className="text-base font-semibold m-0 mb-4 text-red-600 flex items-center gap-2">
          <AlertTriangle size={18} aria-hidden="true" />
          Danger Zone
        </h3>

        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-500 m-0">
            Clear all stored scan data and issue tracking history. This action cannot be undone.
          </p>
          <Button variant="danger" onClick={onClearData}>
            <Trash2 size={14} aria-hidden="true" className="mr-1.5" />
            Clear All Data
          </Button>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onReset}>
          Reset to Defaults
        </Button>
        <Button onClick={onSave}>
          {saved ? <><Check size={14} aria-hidden="true" className="mr-1.5" />Saved!</> : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
