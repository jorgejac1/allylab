import { STORAGE_KEYS } from '../config';
import type { DashboardLayout, WidgetConfig } from '../types';

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'kpi-cards', label: 'KPI Cards', enabled: true, position: 0, size: 'full' },
  { id: 'severity-breakdown', label: 'Severity Breakdown', enabled: true, position: 1, size: 'full' },
  { id: 'top-issues', label: 'Top Issues', enabled: true, position: 2, size: 'half' },
  { id: 'site-rankings', label: 'Site Rankings', enabled: true, position: 3, size: 'half' },
  { id: 'goal-progress', label: 'Goal Progress', enabled: true, position: 4, size: 'half' },
  { id: 'score-trend', label: 'Score Trend', enabled: true, position: 5, size: 'half' },
];

export const DEFAULT_LAYOUT: DashboardLayout = {
  widgets: DEFAULT_WIDGETS,
  updatedAt: new Date().toISOString(),
};

export function getDashboardLayout(): DashboardLayout {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DASHBOARD_LAYOUT);
    if (stored) {
      const parsed = JSON.parse(stored) as DashboardLayout;
      if (parsed.widgets && Array.isArray(parsed.widgets)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load dashboard layout:', error);
  }
  return { ...DEFAULT_LAYOUT, widgets: DEFAULT_WIDGETS.map(w => ({ ...w })) };
}

export function saveDashboardLayout(layout: DashboardLayout): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DASHBOARD_LAYOUT, JSON.stringify(layout));
  } catch (error) {
    console.error('Failed to save dashboard layout:', error);
  }
}

export function resetDashboardLayout(): DashboardLayout {
  try {
    localStorage.removeItem(STORAGE_KEYS.DASHBOARD_LAYOUT);
  } catch (error) {
    console.error('Failed to reset dashboard layout:', error);
  }
  return { ...DEFAULT_LAYOUT, widgets: DEFAULT_WIDGETS.map(w => ({ ...w })) };
}
