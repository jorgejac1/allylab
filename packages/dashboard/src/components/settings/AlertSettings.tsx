import { useState } from 'react';
import { Card, Button, Input } from '../ui';
import { useAlertSettings } from '../../hooks';
import { AlertTriangle } from 'lucide-react';

export function AlertSettings() {
  const { settings, updateSettings, resetToDefaults, defaults } = useAlertSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof typeof settings, value: number | boolean) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(defaults);
    resetToDefaults();
    setHasChanges(false);
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="m-0 text-base font-semibold">Alert Settings</h3>
          <p className="mt-1 mb-0 text-sm text-slate-500">
            Configure regression detection and alert thresholds
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Enable/Disable Regression Alerts */}
        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
          <div>
            <div className="font-medium text-sm">Show Regression Alerts</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Display warnings when accessibility scores drop significantly
            </div>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.showRegressionAlerts}
              onChange={e => handleChange('showRegressionAlerts', e.target.checked)}
              className="w-[18px] h-[18px]"
            />
          </label>
        </div>

        {/* Regression Threshold */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Regression Threshold
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={50}
              value={localSettings.regressionThreshold}
              onChange={e => handleChange('regressionThreshold', parseInt(e.target.value, 10) || 1)}
              style={{ width: 100 }}
              disabled={!localSettings.showRegressionAlerts}
            />
            <span className="text-sm text-slate-500">
              points — Alert when score drops by this amount or more
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Default: {defaults.regressionThreshold} points
          </div>
        </div>

        {/* Recent Days */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Recent Activity Window
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={90}
              value={localSettings.recentDays}
              onChange={e => handleChange('recentDays', parseInt(e.target.value, 10) || 1)}
              style={{ width: 100 }}
              disabled={!localSettings.showRegressionAlerts}
            />
            <span className="text-sm text-slate-500">
              days — Show regressions from this time period
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Default: {defaults.recentDays} days
          </div>
        </div>

        {/* Example Preview */}
        {localSettings.showRegressionAlerts && (
          <div className="p-4 bg-amber-100 border border-amber-500 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-amber-800" />
              <span className="font-medium text-sm text-amber-800">Preview</span>
            </div>
            <div className="text-xs text-amber-900">
              With these settings, you'll be alerted when a scan's score drops by{' '}
              <strong>{localSettings.regressionThreshold}+ points</strong> from the previous scan.
              The Trends page will show regressions from the last{' '}
              <strong>{localSettings.recentDays} days</strong>.
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-slate-200">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-slate-500"
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
          >
            {hasChanges ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
