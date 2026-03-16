import type { FilterPreset } from '../types/filterPreset';
import { STORAGE_KEYS } from '../config';

/**
 * Built-in presets that cannot be deleted
 */
export function getBuiltInPresets(): FilterPreset[] {
  return [
    {
      id: 'builtin_critical_only',
      name: 'Critical Only',
      color: 'red',
      filters: {
        severityFilter: 'critical',
        statusFilter: 'all',
        sourceFilter: 'all',
        fpFilter: 'active',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'builtin_new_issues',
      name: 'New Issues',
      color: 'blue',
      filters: {
        severityFilter: 'all',
        statusFilter: 'new',
        sourceFilter: 'all',
        fpFilter: 'active',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'builtin_active_no_fp',
      name: 'Active (No FP)',
      color: 'emerald',
      filters: {
        severityFilter: 'all',
        statusFilter: 'all',
        sourceFilter: 'all',
        fpFilter: 'active',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ];
}

/**
 * Load user-saved presets from localStorage
 */
function loadUserPresets(): FilterPreset[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FILTER_PRESETS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save user presets to localStorage
 */
function saveUserPresets(presets: FilterPreset[]): void {
  localStorage.setItem(STORAGE_KEYS.FILTER_PRESETS, JSON.stringify(presets));
}

/**
 * Get all presets (built-in + user-saved)
 */
export function getPresets(): FilterPreset[] {
  const builtIn = getBuiltInPresets();
  const userPresets = loadUserPresets();
  return [...builtIn, ...userPresets];
}

/**
 * Save a new preset
 */
export function savePreset(preset: Omit<FilterPreset, 'id' | 'createdAt'>): FilterPreset {
  const newPreset: FilterPreset = {
    ...preset,
    id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  const userPresets = loadUserPresets();
  userPresets.push(newPreset);
  saveUserPresets(userPresets);

  return newPreset;
}

/**
 * Delete a user-saved preset (built-in presets cannot be deleted)
 */
export function deletePreset(id: string): void {
  if (id.startsWith('builtin_')) return;

  const userPresets = loadUserPresets();
  const filtered = userPresets.filter((p) => p.id !== id);
  saveUserPresets(filtered);
}

/**
 * Update the lastUsedAt timestamp for a preset
 */
export function updateLastUsed(id: string): void {
  if (id.startsWith('builtin_')) return;

  const userPresets = loadUserPresets();
  const preset = userPresets.find((p) => p.id === id);
  if (preset) {
    preset.lastUsedAt = new Date().toISOString();
    saveUserPresets(userPresets);
  }
}

/**
 * Set a preset as the default, clearing isDefault on all others
 */
export function setDefaultPreset(id: string): void {
  const userPresets = loadUserPresets();
  for (const p of userPresets) {
    p.isDefault = p.id === id;
  }
  saveUserPresets(userPresets);
}
