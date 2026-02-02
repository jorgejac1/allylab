import { createContext } from 'react';
import type { SavedScan, DrillDownTarget } from '../types';

export type PageId = 'scan' | 'site-scan' | 'reports' | 'executive' | 'benchmark' | 'settings';

interface AppState {
  activePage: PageId;
  currentScan: SavedScan | null;
  drillDownContext: DrillDownTarget | null;
}

interface AppActions {
  navigate: (pageId: PageId) => void;
  setCurrentScan: (scan: SavedScan | null) => void;
  setDrillDown: (target: DrillDownTarget) => void;
  clearDrillDown: () => void;
}

export interface AppContextValue extends AppState, AppActions {}

export const AppContext = createContext<AppContextValue | null>(null);
