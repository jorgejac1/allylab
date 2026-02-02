import type { AlertSettings } from '../types';
import { STORAGE_KEYS } from '../config';

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  regressionThreshold: 5,
  recentDays: 7,
  showRegressionAlerts: true,
};

export function loadAlertSettings(): AlertSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ALERT_SETTINGS);
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
    localStorage.setItem(STORAGE_KEYS.ALERT_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save alert settings:', error);
  }
}