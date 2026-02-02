import { useState, useEffect } from 'react';
import { Card, Button, Input } from '../ui';
import { useReportSettings } from '../../hooks';
import { Target, FileText } from 'lucide-react';

export function ReportSettings() {
  const { settings, updateScoreGoalSettings, updatePdfExportSettings, resetToDefaults, defaults } = useReportSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleGoalChange = (field: keyof typeof settings.scoreGoal, value: number | boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      scoreGoal: { ...prev.scoreGoal, [field]: value },
    }));
    setHasChanges(true);
  };

  const handlePdfChange = (field: keyof typeof settings.pdfExport, value: boolean | string) => {
    setLocalSettings(prev => ({
      ...prev,
      pdfExport: { ...prev.pdfExport, [field]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateScoreGoalSettings(localSettings.scoreGoal);
    updatePdfExportSettings(localSettings.pdfExport);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(defaults);
    resetToDefaults();
    setHasChanges(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Score Goal Settings */}
      <Card>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Target size={18} /> Score Goal</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Set your target accessibility score and track progress
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Goal Score */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              Target Score
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Input
                type="number"
                min={50}
                max={100}
                value={localSettings.scoreGoal.scoreGoal}
                onChange={e => handleGoalChange('scoreGoal', parseInt(e.target.value, 10) || 90)}
                style={{ width: 100 }}
              />
              <span style={{ fontSize: 13, color: '#64748b' }}>
                /100 — Your accessibility compliance target
              </span>
            </div>
          </div>

          {/* Show Goal Line */}
          <ToggleRow
            label="Show Goal Line on Charts"
            description="Display a reference line at your target score on trend charts"
            checked={localSettings.scoreGoal.showScoreGoal}
            onChange={checked => handleGoalChange('showScoreGoal', checked)}
          />

          {/* Show Progress Bar */}
          <ToggleRow
            label="Show Goal Progress"
            description="Display a progress bar showing how close you are to your goal"
            checked={localSettings.scoreGoal.showGoalProgress}
            onChange={checked => handleGoalChange('showGoalProgress', checked)}
          />
        </div>
      </Card>

      {/* PDF Export Settings */}
      <Card>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}><FileText size={18} /> PDF Export</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Customize what's included in exported PDF reports
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Company Name */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              Company Name
            </label>
            <Input
              value={localSettings.pdfExport.companyName}
              onChange={e => handlePdfChange('companyName', e.target.value)}
              placeholder="Your Company Name"
              style={{ maxWidth: 300 }}
            />
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Appears in the PDF header. Leave blank to use "AllyLab"
            </p>
          </div>

          {/* Include Options */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
              Include in Reports
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <CheckboxRow
                label="Summary Statistics"
                checked={localSettings.pdfExport.includeStats}
                onChange={checked => handlePdfChange('includeStats', checked)}
              />
              <CheckboxRow
                label="Score Trend Table"
                checked={localSettings.pdfExport.includeScoreTrend}
                onChange={checked => handlePdfChange('includeScoreTrend', checked)}
              />
              <CheckboxRow
                label="Issue Trend Data"
                checked={localSettings.pdfExport.includeIssueTrend}
                onChange={checked => handlePdfChange('includeIssueTrend', checked)}
              />
              <CheckboxRow
                label="Issue Distribution"
                checked={localSettings.pdfExport.includeDistribution}
                onChange={checked => handlePdfChange('includeDistribution', checked)}
              />
              <CheckboxRow
                label="Text Summary"
                checked={localSettings.pdfExport.includeSummary}
                onChange={checked => handlePdfChange('includeSummary', checked)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card style={{ background: '#f8fafc' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Preview</h4>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <PreviewItem label="Target Score" value={`${localSettings.scoreGoal.scoreGoal}/100`} />
          <PreviewItem label="Goal Line" value={localSettings.scoreGoal.showScoreGoal ? 'Visible' : 'Hidden'} />
          <PreviewItem label="Progress Bar" value={localSettings.scoreGoal.showGoalProgress ? 'Visible' : 'Hidden'} />
          <PreviewItem 
            label="PDF Sections" 
            value={`${[
              localSettings.pdfExport.includeStats,
              localSettings.pdfExport.includeScoreTrend,
              localSettings.pdfExport.includeIssueTrend,
              localSettings.pdfExport.includeDistribution,
              localSettings.pdfExport.includeSummary,
            ].filter(Boolean).length} of 5`} 
          />
        </div>
      </Card>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: 16,
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <Button variant="ghost" onClick={handleReset} style={{ color: '#64748b' }}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges}>
          {hasChanges ? 'Save Changes' : 'Saved'}
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
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
        <div style={{ fontWeight: 500, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{description}</div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={{ width: 18, height: 18 }}
        />
      </label>
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        padding: '8px 12px',
        background: checked ? '#eff6ff' : '#f8fafc',
        borderRadius: 6,
        border: `1px solid ${checked ? '#bfdbfe' : '#e2e8f0'}`,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ width: 16, height: 16 }}
      />
      <span style={{ fontSize: 13, color: checked ? '#1e40af' : '#475569' }}>{label}</span>
    </label>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{value}</div>
    </div>
  );
}