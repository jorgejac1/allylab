import type { ReportSettings, ScoreGoalSettings, PdfExportSettings } from '../types';
import { STORAGE_KEYS } from '../config';

export const DEFAULT_SCORE_GOAL_SETTINGS: ScoreGoalSettings = {
  scoreGoal: 90,
  showScoreGoal: true,
  showGoalProgress: true,
};

export const DEFAULT_PDF_EXPORT_SETTINGS: PdfExportSettings = {
  includeScoreTrend: true,
  includeIssueTrend: true,
  includeDistribution: true,
  includeStats: true,
  includeSummary: true,
  companyName: '',
  logoUrl: '',
};

export const DEFAULT_REPORT_SETTINGS: ReportSettings = {
  scoreGoal: DEFAULT_SCORE_GOAL_SETTINGS,
  pdfExport: DEFAULT_PDF_EXPORT_SETTINGS,
};

export function loadReportSettings(): ReportSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.REPORT_SETTINGS);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        scoreGoal: { ...DEFAULT_SCORE_GOAL_SETTINGS, ...parsed.scoreGoal },
        pdfExport: { ...DEFAULT_PDF_EXPORT_SETTINGS, ...parsed.pdfExport },
      };
    }
  } catch (error) {
    console.error('Failed to load report settings:', error);
  }
  return DEFAULT_REPORT_SETTINGS;
}

export function saveReportSettings(settings: ReportSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REPORT_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save report settings:', error);
  }
}