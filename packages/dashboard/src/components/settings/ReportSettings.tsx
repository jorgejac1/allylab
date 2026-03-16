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
    <div className="flex flex-col gap-6">
      {/* Score Goal Settings */}
      <Card>
        <div className="mb-5">
          <h3 className="m-0 text-base font-semibold inline-flex items-center gap-2"><Target size={18} /> Score Goal</h3>
          <p className="mt-1 mb-0 text-sm text-slate-500">
            Set your target accessibility score and track progress
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Goal Score */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Target Score
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={50}
                max={100}
                value={localSettings.scoreGoal.scoreGoal}
                onChange={e => handleGoalChange('scoreGoal', parseInt(e.target.value, 10) || 90)}
                style={{ width: 100 }}
              />
              <span className="text-sm text-slate-500">
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
        <div className="mb-5">
          <h3 className="m-0 text-base font-semibold inline-flex items-center gap-2"><FileText size={18} /> PDF Export</h3>
          <p className="mt-1 mb-0 text-sm text-slate-500">
            Customize what's included in exported PDF reports
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Company Name
            </label>
            <Input
              value={localSettings.pdfExport.companyName}
              onChange={e => handlePdfChange('companyName', e.target.value)}
              placeholder="Your Company Name"
              style={{ maxWidth: 300 }}
            />
            <p className="text-xs text-slate-400 mt-1">
              Appears in the PDF header. Leave blank to use "AllyLab"
            </p>
          </div>

          {/* Include Options */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Include in Reports
            </label>
            <div className="flex flex-col gap-3">
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
      <Card className="bg-slate-50">
        <h4 className="mt-0 mb-3 text-sm font-semibold">Preview</h4>
        <div className="flex gap-6 flex-wrap">
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
      <div className="flex justify-between pt-4 border-t border-slate-200">
        <Button variant="ghost" onClick={handleReset} className="text-slate-500">
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
    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
      </div>
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="w-[18px] h-[18px]"
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
      className="flex items-center gap-2.5 cursor-pointer py-2 px-3 rounded-md"
      style={{
        background: checked ? '#eff6ff' : '#f8fafc',
        border: `1px solid ${checked ? '#bfdbfe' : '#e2e8f0'}`,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4"
      />
      <span className="text-sm" style={{ color: checked ? '#1e40af' : '#475569' }}>{label}</span>
    </label>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
