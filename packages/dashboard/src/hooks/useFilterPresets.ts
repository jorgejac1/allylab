import { useState, useCallback } from 'react';
import type { FilterPreset } from '../types/filterPreset';
import {
  getPresets,
  savePreset as savePresetToStorage,
  deletePreset as deletePresetFromStorage,
  updateLastUsed,
  setDefaultPreset,
} from '../utils/filterPresets';
import { addAuditEntry } from '../utils/auditLog';

export interface UseFilterPresetsResult {
  presets: FilterPreset[];
  activePreset: FilterPreset | null;
  saveCurrentAsPreset: (name: string, color?: string) => FilterPreset;
  applyPreset: (id: string) => FilterPreset | null;
  deletePreset: (id: string) => void;
  setAsDefault: (id: string) => void;
  clearActivePreset: () => void;
}

export function useFilterPresets(): UseFilterPresetsResult {
  const [presets, setPresets] = useState<FilterPreset[]>(() => getPresets());
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const activePreset = activePresetId
    ? presets.find((p) => p.id === activePresetId) ?? null
    : null;

  const saveCurrentAsPreset = useCallback((name: string, color?: string): FilterPreset => {
    // Default filters for a new preset — caller will typically override via the modal context
    const newPreset = savePresetToStorage({
      name,
      color,
      filters: {
        severityFilter: 'all',
        statusFilter: 'all',
        sourceFilter: 'all',
        fpFilter: 'active',
      },
    });
    setPresets(getPresets());
    addAuditEntry({ eventType: 'preset:saved', severity: 'info', action: `Saved filter preset "${name}"`, resourceType: 'preset', resourceId: newPreset.id, success: true });
    return newPreset;
  }, []);

  const applyPreset = useCallback((id: string): FilterPreset | null => {
    const allPresets = getPresets();
    const preset = allPresets.find((p) => p.id === id) ?? null;
    if (preset) {
      updateLastUsed(id);
      setActivePresetId(id);
    }
    return preset;
  }, []);

  const handleDeletePreset = useCallback((id: string) => {
    deletePresetFromStorage(id);
    addAuditEntry({ eventType: 'preset:deleted', severity: 'info', action: `Deleted filter preset "${id}"`, resourceType: 'preset', resourceId: id, success: true });
    setPresets(getPresets());
    if (activePresetId === id) {
      setActivePresetId(null);
    }
  }, [activePresetId]);

  const setAsDefault = useCallback((id: string) => {
    setDefaultPreset(id);
    setPresets(getPresets());
  }, []);

  const clearActivePreset = useCallback(() => {
    setActivePresetId(null);
  }, []);

  return {
    presets,
    activePreset,
    saveCurrentAsPreset,
    applyPreset,
    deletePreset: handleDeletePreset,
    setAsDefault,
    clearActivePreset,
  };
}
