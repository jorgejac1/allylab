import { useCallback, useMemo } from 'react';
import { getApiBase } from '../utils/api';
import { getErrorMessage } from '../utils/fetchWithError';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  ok: boolean;
}

interface ApiClient {
  /**
   * Make a GET request
   */
  get: <T>(path: string, options?: RequestInit) => Promise<ApiResponse<T>>;

  /**
   * Make a POST request with JSON body
   */
  post: <T>(path: string, body?: unknown, options?: RequestInit) => Promise<ApiResponse<T>>;

  /**
   * Make a PATCH request with JSON body
   */
  patch: <T>(path: string, body?: unknown, options?: RequestInit) => Promise<ApiResponse<T>>;

  /**
   * Make a PUT request with JSON body
   */
  put: <T>(path: string, body?: unknown, options?: RequestInit) => Promise<ApiResponse<T>>;

  /**
   * Make a DELETE request
   */
  delete: <T>(path: string, options?: RequestInit) => Promise<ApiResponse<T>>;

  /**
   * Make a request with custom method
   */
  request: <T>(path: string, options?: RequestOptions) => Promise<ApiResponse<T>>;

  /**
   * Get the full URL for a path
   */
  getUrl: (path: string) => string;
}

/**
 * Hook for making API requests with consistent error handling and base URL configuration.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const api = useApi();
 *
 *   const loadData = async () => {
 *     const { data, error, ok } = await api.get<User[]>('/users');
 *     if (ok) {
 *       setUsers(data);
 *     } else {
 *       setError(error);
 *     }
 *   };
 *
 *   const createUser = async (user: CreateUserInput) => {
 *     const { data, error, ok } = await api.post<User>('/users', user);
 *     if (ok) {
 *       setUsers(prev => [...prev, data]);
 *     }
 *   };
 * }
 * ```
 */
export function useApi(): ApiClient {
  const request = useCallback(async <T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> => {
    const { body, ...fetchOptions } = options;
    const baseUrl = getApiBase();
    const url = `${baseUrl}${path}`;

    const headers: HeadersInit = {
      ...(fetchOptions.headers || {}),
    };

    // Add Content-Type for JSON body
    if (body !== undefined) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        // Try to extract error message from response body
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Response body is not JSON, use default message
        }
        return { data: null, error: errorMessage, ok: false };
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        return { data, error: null, ok: true };
      }

      // Return null for non-JSON responses
      return { data: null, error: null, ok: true };
    } catch (err) {
      return { data: null, error: getErrorMessage(err), ok: false };
    }
  }, []);

  const get = useCallback(<T>(path: string, options?: RequestInit) => {
    return request<T>(path, { ...options, method: 'GET' });
  }, [request]);

  const post = useCallback(<T>(path: string, body?: unknown, options?: RequestInit) => {
    return request<T>(path, { ...options, method: 'POST', body });
  }, [request]);

  const patch = useCallback(<T>(path: string, body?: unknown, options?: RequestInit) => {
    return request<T>(path, { ...options, method: 'PATCH', body });
  }, [request]);

  const put = useCallback(<T>(path: string, body?: unknown, options?: RequestInit) => {
    return request<T>(path, { ...options, method: 'PUT', body });
  }, [request]);

  const del = useCallback(<T>(path: string, options?: RequestInit) => {
    return request<T>(path, { ...options, method: 'DELETE' });
  }, [request]);

  const getUrl = useCallback((path: string) => {
    return `${getApiBase()}${path}`;
  }, []);

  return useMemo(() => ({
    get,
    post,
    patch,
    put,
    delete: del,
    request,
    getUrl,
  }), [get, post, patch, put, del, request, getUrl]);
}

/**
 * Combines useApi with state management for common CRUD operations.
 * Returns an object with async methods that handle loading/error state.
 *
 * @example
 * ```tsx
 * function UsersComponent() {
 *   const { data: users, isLoading, error, actions } = useApiResource<User[]>('/users');
 *
 *   useEffect(() => {
 *     actions.load();
 *   }, []);
 *
 *   const handleCreate = async (user: CreateUserInput) => {
 *     const newUser = await actions.create(user);
 *     if (newUser) {
 *       // Success
 *     }
 *   };
 * }
 * ```
 */
export type { ApiClient, ApiResponse, RequestOptions };
