export type WidgetId =
  | 'kpi-cards'
  | 'severity-breakdown'
  | 'top-issues'
  | 'site-rankings'
  | 'goal-progress'
  | 'score-trend';

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  enabled: boolean;
  position: number;
  size: 'half' | 'full';
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
  updatedAt: string;
}
