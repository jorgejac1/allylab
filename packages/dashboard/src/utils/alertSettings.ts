import type { AlertSettings } from '../types';

const STORAGE_KEY = 'allylab_alert_settings';

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  regressionThreshold: 5,
  recentDays: 7,
  showRegressionAlerts: true,
};

export function loadAlertSettings(): AlertSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load alert settings:', error);
  }
  return DEFAULT_ALERT_SETTINGS;
}

export function saveAlertSettings(settings: AlertSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save alert settings:', error);
  }
}