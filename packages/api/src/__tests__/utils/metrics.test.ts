import { describe, it, expect, beforeEach } from 'vitest';
import {
  httpRequestsTotal,
  getMetrics,
  getMetricsContentType,
  recordHttpRequest,
  recordScan,
  updateBrowserPoolMetrics,
  recordCacheOperation,
  recordError,
  resetMetrics,
} from '../../utils/metrics';

describe('utils/metrics', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('getMetrics', () => {
    it('returns metrics in Prometheus text format', async () => {
      const metrics = await getMetrics();
      expect(typeof metrics).toBe('string');
      expect(metrics).toContain('allylab_');
    });
  });

  describe('getMetricsContentType', () => {
    it('returns correct content type for Prometheus', () => {
      const contentType = getMetricsContentType();
      expect(contentType).toContain('text/plain');
    });
  });

  describe('recordHttpRequest', () => {
    it('increments request counter', async () => {
      recordHttpRequest('GET', '/api/test', 200, 0.1);

      const metrics = await getMetrics();
      expect(metrics).toContain('allylab_http_requests_total');
    });

    it('records request duration in histogram', async () => {
      recordHttpRequest('POST', '/api/scan', 201, 2.5);

      const metrics = await getMetrics();
      expect(metrics).toContain('allylab_http_request_duration_seconds');
    });

    it('normalizes paths with UUIDs', async () => {
      recordHttpRequest('GET', '/api/scan/123e4567-e89b-12d3-a456-426614174000', 200, 0.05);

      const metrics = await getMetrics();
      // Should have normalized the UUID
      expect(metrics).toContain('/:id');
    });

    it('normalizes paths with numeric IDs', async () => {
      recordHttpRequest('GET', '/api/findings/12345', 200, 0.05);

      const metrics = await getMetrics();
      expect(metrics).toContain('/:id');
    });

    it('strips query parameters', async () => {
      recordHttpRequest('GET', '/api/scan?url=test', 200, 0.05);

      const metrics = await getMetrics();
      expect(metrics).not.toContain('url=test');
    });
  });

  describe('recordScan', () => {
    it('increments scan counter with status', async () => {
      recordScan('desktop', 'success', 5.0);

      const metrics = await getMetrics();
      expect(metrics).toContain('allylab_scans_total');
      expect(metrics).toContain('viewport="desktop"');
    });

    it('records scan duration', async () => {
      recordScan('mobile', 'success', 10.5);

      const metrics = await getMetrics();
      expect(metrics).toContain('allylab_scan_duration_seconds');
    });

    it('records violations by severity', async () => {
      recordScan('desktop', 'success', 5.0, {
        critical: 2,
        serious: 5,
        moderate: 10,
        minor: 3,
      });

      const metrics = await getMetrics();
      expect(metrics).toContain('allylab_violations_total');
      expect(metrics).toContain('severity="critical"');
      expect(metrics).toContain('severity="serious"');
    });
  });

  describe('updateBrowserPoolMetrics', () => {
    it('sets pool size gauges', async () => {
      updateBrowserPoolMetrics(5, 3, 2);

      const metrics = await getMetrics();
      expect(metrics).toContain('allylab_browser_pool_size');
      expect(metrics).toContain('allylab_browser_pool_waiting');
    });
  });

  describe('recordCacheOperation', () => {
    it('increments cache hits counter', async () => {
      recordCacheOperation('github', true, 10);

      const metrics = await getMetrics();
      expect(metrics).toContain('allylab_cache_hits_total');
    });

    it('increments cache misses counter', async () => {
      recordCacheOperation('github', false, 10);

      const metrics = await getMetrics();
      expect(metrics).toContain('allylab_cache_misses_total');
    });

    it('sets cache size gauge', async () => {
      recordCacheOperation('repos', true, 25);

      const metrics = await getMetrics();
      expect(metrics).toContain('allylab_cache_size');
    });
  });

  describe('recordError', () => {
    it('increments error counter with type', async () => {
      recordError('http', 'ValidationError');

      const metrics = await getMetrics();
      expect(metrics).toContain('allylab_errors_total');
    });

    it('uses unknown for missing code', async () => {
      recordError('scan');

      const metrics = await getMetrics();
      expect(metrics).toContain('code="unknown"');
    });
  });

  describe('resetMetrics', () => {
    it('resets all metrics', async () => {
      recordHttpRequest('GET', '/test', 200, 0.1);
      recordScan('desktop', 'success', 5.0);

      resetMetrics();

      // After reset, counters should be 0
      const counterValue = await httpRequestsTotal.get();
      expect(counterValue.values.length).toBe(0);
    });
  });

  describe('default metrics', () => {
    it('includes Node.js process metrics', async () => {
      const metrics = await getMetrics();
      // Default metrics should include process info
      expect(metrics).toContain('nodejs_');
    });
  });
});
