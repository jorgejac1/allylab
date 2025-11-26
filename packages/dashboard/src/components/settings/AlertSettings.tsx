import { useState } from 'react';
import { Card, Button, Input } from '../ui';
import { useAlertSettings } from '../../hooks';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Alert Settings</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Configure regression detection and alert thresholds
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Enable/Disable Regression Alerts */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            background: '#f8fafc',
            borderRadius: 8,
          }}
        >
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>Show Regression Alerts</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Display warnings when accessibility scores drop significantly
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localSettings.showRegressionAlerts}
              onChange={e => handleChange('showRegressionAlerts', e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
          </label>
        </div>

        {/* Regression Threshold */}
        <div>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
            Regression Threshold
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Input
              type="number"
              min={1}
              max={50}
              value={localSettings.regressionThreshold}
              onChange={e => handleChange('regressionThreshold', parseInt(e.target.value, 10) || 1)}
              style={{ width: 100 }}
              disabled={!localSettings.showRegressionAlerts}
            />
            <span style={{ fontSize: 13, color: '#64748b' }}>
              points — Alert when score drops by this amount or more
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Default: {defaults.regressionThreshold} points
          </div>
        </div>

        {/* Recent Days */}
        <div>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
            Recent Activity Window
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Input
              type="number"
              min={1}
              max={90}
              value={localSettings.recentDays}
              onChange={e => handleChange('recentDays', parseInt(e.target.value, 10) || 1)}
              style={{ width: 100 }}
              disabled={!localSettings.showRegressionAlerts}
            />
            <span style={{ fontSize: 13, color: '#64748b' }}>
              days — Show regressions from this time period
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Default: {defaults.recentDays} days
          </div>
        </div>

        {/* Example Preview */}
        {localSettings.showRegressionAlerts && (
          <div
            style={{
              padding: 16,
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span>⚠️</span>
              <span style={{ fontWeight: 500, fontSize: 13, color: '#92400e' }}>Preview</span>
            </div>
            <div style={{ fontSize: 12, color: '#78350f' }}>
              With these settings, you'll be alerted when a scan's score drops by{' '}
              <strong>{localSettings.regressionThreshold}+ points</strong> from the previous scan.
              The Trends page will show regressions from the last{' '}
              <strong>{localSettings.recentDays} days</strong>.
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <Button
            variant="ghost"
            onClick={handleReset}
            style={{ color: '#64748b' }}
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