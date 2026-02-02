// Re-export everything for convenient imports
export { AppProvider } from './AppContext';
export { AppContext, type PageId, type AppContextValue } from './appContextDef';
export { useApp, useNavigation, useCurrentScan, useDrillDown } from './useAppHooks';

// Re-export auth context from contexts folder
export {
  AuthProvider,
  useAuth,
  usePermission,
  usePermissions,
  useRole,
} from '../contexts/AuthContext';
