import { useState, useCallback, useMemo, type ReactNode } from 'react';
import type { SavedScan, DrillDownTarget } from '../types';
import { AppContext, type PageId, type AppContextValue } from './appContextDef';

interface AppProviderProps {
  children: ReactNode;
  initialPage?: PageId;
}

export function AppProvider({ children, initialPage = 'scan' }: AppProviderProps) {
  // State
  const [activePage, setActivePage] = useState<PageId>(initialPage);
  const [currentScan, setCurrentScan] = useState<SavedScan | null>(null);
  const [drillDownContext, setDrillDownContext] = useState<DrillDownTarget | null>(null);

  // Navigation
  const navigate = useCallback((pageId: PageId) => {
    setActivePage(pageId);
    // Clear drill-down when navigating away
    if (pageId !== 'scan') {
      setDrillDownContext(null);
    }
  }, []);

  // Drill-down
  const setDrillDown = useCallback((target: DrillDownTarget) => {
    setDrillDownContext(target);
    setActivePage('scan');
  }, []);

  const clearDrillDown = useCallback(() => {
    setDrillDownContext(null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<AppContextValue>(() => ({
    // State
    activePage,
    currentScan,
    drillDownContext,
    // Actions
    navigate,
    setCurrentScan,
    setDrillDown,
    clearDrillDown,
  }), [activePage, currentScan, drillDownContext, navigate, setDrillDown, clearDrillDown]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
