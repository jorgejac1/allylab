import { useContext } from 'react';
import { AppContext, type AppContextValue } from './appContextDef';

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks for specific parts of the context
export function useNavigation() {
  const { activePage, navigate } = useApp();
  return { activePage, navigate };
}

export function useCurrentScan() {
  const { currentScan, setCurrentScan } = useApp();
  return { currentScan, setCurrentScan };
}

export function useDrillDown() {
  const { drillDownContext, setDrillDown, clearDrillDown } = useApp();
  return { drillDownContext, setDrillDown, clearDrillDown };
}
