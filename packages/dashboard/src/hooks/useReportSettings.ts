import { useState, useCallback } from 'react';
import type { ReportSettings, ScoreGoalSettings, PdfExportSettings } from '../types';
import {
  loadReportSettings,
  saveReportSettings,
  DEFAULT_REPORT_SETTINGS,
} from '../utils/reportSettings';

export function useReportSettings() {
  const [settings, setSettings] = useState<ReportSettings>(() => loadReportSettings());

  const updateScoreGoalSettings = useCallback((updates: Partial<ScoreGoalSettings>) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        scoreGoal: { ...prev.scoreGoal, ...updates },
      };
      saveReportSettings(newSettings);
      return newSettings;
    });
  }, []);

  const updatePdfExportSettings = useCallback((updates: Partial<PdfExportSettings>) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        pdfExport: { ...prev.pdfExport, ...updates },
      };
      saveReportSettings(newSettings);
      return newSettings;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_REPORT_SETTINGS);
    saveReportSettings(DEFAULT_REPORT_SETTINGS);
  }, []);

  return {
    settings,
    updateScoreGoalSettings,
    updatePdfExportSettings,
    resetToDefaults,
    defaults: DEFAULT_REPORT_SETTINGS,
  };
}