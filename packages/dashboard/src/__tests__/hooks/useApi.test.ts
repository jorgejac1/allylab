import { renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { useApi } from '../../hooks/useApi';

describe('hooks/useApi', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage for getApiBase
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('get', () => {
    it('makes GET request and returns data on success', async () => {
      const mockData = { id: 1, name: 'Test' };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockData),
      });

      const { result } = renderHook(() => useApi());
      const response = await result.current.get<typeof mockData>('/users/1');

      expect(response.ok).toBe(true);
      expect(response.data).toEqual(mockData);
      expect(response.error).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('returns error on HTTP failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'User not found' }),
      });

      const { result } = renderHook(() => useApi());
      const response = await result.current.get('/users/999');

      expect(response.ok).toBe(false);
      expect(response.data).toBeNull();
      expect(response.error).toBe('User not found');
    });

    it('extracts message field from error response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Invalid request' }),
      });

      const { result } = renderHook(() => useApi());
      const response = await result.current.get('/bad');

      expect(response.error).toBe('Invalid request');
    });

    it('falls back to HTTP status when JSON parse fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Not JSON')),
      });

      const { result } = renderHook(() => useApi());
      const response = await result.current.get('/error');

      expect(response.error).toBe('HTTP 500: Internal Server Error');
    });
  });

  describe('post', () => {
    it('makes POST request with JSON body', async () => {
      const mockResponse = { id: 1, name: 'Created' };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useApi());
      const body = { name: 'New User' };
      const response = await result.current.post<typeof mockResponse>('/users', body);

      expect(response.ok).toBe(true);
      expect(response.data).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(body),
        })
      );
    });

    it('handles POST without body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => useApi());
      await result.current.post('/action');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/action'),
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      );
    });
  });

  describe('patch', () => {
    it('makes PATCH request with JSON body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ id: 1, name: 'Updated' }),
      });

      const { result } = renderHook(() => useApi());
      const body = { name: 'Updated Name' };
      await result.current.patch('/users/1', body);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      );
    });
  });

  describe('put', () => {
    it('makes PUT request with JSON body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ id: 1 }),
      });

      const { result } = renderHook(() => useApi());
      const body = { name: 'Full Update' };
      await result.current.put('/users/1', body);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(body),
        })
      );
    });
  });

  describe('delete', () => {
    it('makes DELETE request', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ deleted: true }),
      });

      const { result } = renderHook(() => useApi());
      const response = await result.current.delete('/users/1');

      expect(response.ok).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('request', () => {
    it('handles network errors', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useApi());
      const response = await result.current.request('/users');

      expect(response.ok).toBe(false);
      expect(response.data).toBeNull();
      expect(response.error).toBe('Network error');
    });

    it('handles non-JSON responses', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'text/plain' },
      });

      const { result } = renderHook(() => useApi());
      const response = await result.current.get('/text');

      expect(response.ok).toBe(true);
      expect(response.data).toBeNull();
    });

    it('handles non-Error thrown values', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue('string error');

      const { result } = renderHook(() => useApi());
      const response = await result.current.get('/error');

      expect(response.ok).toBe(false);
      expect(response.error).toBe('string error');
    });
  });

  describe('getUrl', () => {
    it('returns full URL for a path', () => {
      const { result } = renderHook(() => useApi());
      const url = result.current.getUrl('/users');

      expect(url).toContain('/users');
    });
  });

  describe('with custom API base', () => {
    it('uses localStorage API base if set', async () => {
      const customBase = 'https://custom-api.example.com';
      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(customBase);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useApi());
      await result.current.get('/test');

      expect(fetch).toHaveBeenCalledWith(
        `${customBase}/test`,
        expect.anything()
      );
    });
  });
});
