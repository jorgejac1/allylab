import { useState, useCallback } from 'react';
import type { AlertSettings } from '../types';
import { loadAlertSettings, saveAlertSettings, DEFAULT_ALERT_SETTINGS } from '../utils/alertSettings';

export function useAlertSettings() {
  const [settings, setSettings] = useState<AlertSettings>(() => loadAlertSettings());

  const updateSettings = useCallback((updates: Partial<AlertSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      saveAlertSettings(newSettings);
      return newSettings;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_ALERT_SETTINGS);
    saveAlertSettings(DEFAULT_ALERT_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    resetToDefaults,
    defaults: DEFAULT_ALERT_SETTINGS,
  };
}