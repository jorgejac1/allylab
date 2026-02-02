import { useState, useCallback, useRef } from 'react';
import { getErrorMessage } from '../utils/fetchWithError';

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseAsyncOperationResult<T, Args extends unknown[]> extends AsyncState<T> {
  /** Execute the async operation */
  execute: (...args: Args) => Promise<T | null>;
  /** Reset state to initial values */
  reset: () => void;
  /** Clear just the error */
  clearError: () => void;
  /** Set data manually */
  setData: (data: T | null) => void;
}

/**
 * Hook for managing async operation state (loading, error, data).
 * Provides consistent patterns for async operations across the app.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, execute } = useAsyncOperation(
 *   async (userId: string) => {
 *     const response = await fetch(`/api/users/${userId}`);
 *     return response.json();
 *   }
 * );
 *
 * // Later in component
 * <button onClick={() => execute('123')}>Load User</button>
 * {isLoading && <Spinner />}
 * {error && <Error message={error} />}
 * {data && <UserCard user={data} />}
 * ```
 */
export function useAsyncOperation<T, Args extends unknown[] = []>(
  operation: (...args: Args) => Promise<T>
): UseAsyncOperationResult<T, Args> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  // Track if component is mounted to avoid state updates after unmount
  const isMountedRef = useRef(true);

  // Track current operation to handle race conditions
  const operationIdRef = useRef(0);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      const currentOperationId = ++operationIdRef.current;

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await operation(...args);

        // Only update state if this is still the latest operation and component is mounted
        if (isMountedRef.current && currentOperationId === operationIdRef.current) {
          setState({ data: result, isLoading: false, error: null });
        }

        return result;
      } catch (err) {
        const errorMessage = getErrorMessage(err);

        if (isMountedRef.current && currentOperationId === operationIdRef.current) {
          setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        }

        return null;
      }
    },
    [operation]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    clearError,
    setData,
  };
}

/**
 * Simplified hook for operations that don't return data.
 * Useful for mutations like delete, update, etc.
 */
export function useAsyncAction<Args extends unknown[] = []>(
  action: (...args: Args) => Promise<void>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: Args): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await action(...args);
        setIsLoading(false);
        return true;
      } catch (err) {
        setError(getErrorMessage(err));
        setIsLoading(false);
        return false;
      }
    },
    [action]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { isLoading, error, execute, clearError };
}
