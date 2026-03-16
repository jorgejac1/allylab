import { useState, useCallback } from 'react';
import {
  getDashboardLayout,
  saveDashboardLayout,
  resetDashboardLayout,
} from '../utils/dashboardLayout';
import type { DashboardLayout, WidgetId } from '../types';
import { addAuditEntry } from '../utils/auditLog';

export interface UseDashboardLayoutResult {
  layout: DashboardLayout;
  isEditing: boolean;
  toggleWidget: (id: WidgetId) => void;
  reorderWidgets: (fromIndex: number, toIndex: number) => void;
  resizeWidget: (id: WidgetId, size: 'half' | 'full') => void;
  startEditing: () => void;
  saveEdits: () => void;
  cancelEdits: () => void;
  resetToDefaults: () => void;
}

export function useDashboardLayout(): UseDashboardLayoutResult {
  const [layout, setLayout] = useState<DashboardLayout>(() => getDashboardLayout());
  const [draft, setDraft] = useState<DashboardLayout | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const currentLayout = draft ?? layout;

  const startEditing = useCallback(() => {
    setDraft({
      widgets: layout.widgets.map(w => ({ ...w })),
      updatedAt: layout.updatedAt,
    });
    setIsEditing(true);
  }, [layout]);

  const saveEdits = useCallback(() => {
    if (draft) {
      const updated: DashboardLayout = {
        ...draft,
        updatedAt: new Date().toISOString(),
      };
      saveDashboardLayout(updated);
      setLayout(updated);
      addAuditEntry({ eventType: 'dashboard:customized', severity: 'info', action: 'Customized dashboard layout', resourceType: 'dashboard', resourceId: 'layout', success: true });
    }
    setDraft(null);
    setIsEditing(false);
  }, [draft]);

  const cancelEdits = useCallback(() => {
    setDraft(null);
    setIsEditing(false);
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaultLayout = resetDashboardLayout();
    setLayout(defaultLayout);
    addAuditEntry({ eventType: 'dashboard:customized', severity: 'info', action: 'Reset dashboard layout to defaults', resourceType: 'dashboard', resourceId: 'layout', success: true });
    setDraft(null);
    setIsEditing(false);
  }, []);

  const toggleWidget = useCallback((id: WidgetId) => {
    setDraft(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        widgets: prev.widgets.map(w =>
          w.id === id ? { ...w, enabled: !w.enabled } : w
        ),
      };
    });
  }, []);

  const reorderWidgets = useCallback((fromIndex: number, toIndex: number) => {
    setDraft(prev => {
      if (!prev) return prev;
      const widgets = [...prev.widgets];
      const [moved] = widgets.splice(fromIndex, 1);
      widgets.splice(toIndex, 0, moved);
      // Reassign positions after reorder
      const reindexed = widgets.map((w, i) => ({ ...w, position: i }));
      return { ...prev, widgets: reindexed };
    });
  }, []);

  const resizeWidget = useCallback((id: WidgetId, size: 'half' | 'full') => {
    setDraft(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        widgets: prev.widgets.map(w =>
          w.id === id ? { ...w, size } : w
        ),
      };
    });
  }, []);

  return {
    layout: currentLayout,
    isEditing,
    toggleWidget,
    reorderWidgets,
    resizeWidget,
    startEditing,
    saveEdits,
    cancelEdits,
    resetToDefaults,
  };
}
