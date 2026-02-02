/**
 * Prometheus Metrics Collection
 *
 * Provides application-level metrics for monitoring and observability.
 * Exposes metrics in Prometheus text format at /metrics endpoint.
 */

import client from 'prom-client';

// Collect default Node.js metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({
  prefix: 'allylab_',
  labels: { service: 'api' },
});

// ============================================
// HTTP Request Metrics
// ============================================

export const httpRequestsTotal = new client.Counter({
  name: 'allylab_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'] as const,
});

export const httpRequestDuration = new client.Histogram({
  name: 'allylab_http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'path', 'status'] as const,
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

export const httpRequestsInProgress = new client.Gauge({
  name: 'allylab_http_requests_in_progress',
  help: 'Number of HTTP requests currently being processed',
  labelNames: ['method'] as const,
});

// ============================================
// Scan Metrics
// ============================================

export const scansTotal = new client.Counter({
  name: 'allylab_scans_total',
  help: 'Total number of accessibility scans',
  labelNames: ['viewport', 'status'] as const,
});

export const scanDuration = new client.Histogram({
  name: 'allylab_scan_duration_seconds',
  help: 'Accessibility scan duration in seconds',
  labelNames: ['viewport'] as const,
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

export const violationsTotal = new client.Counter({
  name: 'allylab_violations_total',
  help: 'Total number of accessibility violations found',
  labelNames: ['severity'] as const,
});

// ============================================
// Browser Pool Metrics
// ============================================

export const browserPoolSize = new client.Gauge({
  name: 'allylab_browser_pool_size',
  help: 'Current browser pool size',
  labelNames: ['state'] as const, // active, idle
});

export const browserPoolWaiting = new client.Gauge({
  name: 'allylab_browser_pool_waiting',
  help: 'Number of requests waiting for a browser page',
});

// ============================================
// Cache Metrics
// ============================================

export const cacheHits = new client.Counter({
  name: 'allylab_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache'] as const,
});

export const cacheMisses = new client.Counter({
  name: 'allylab_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache'] as const,
});

export const cacheSize = new client.Gauge({
  name: 'allylab_cache_size',
  help: 'Current number of entries in cache',
  labelNames: ['cache'] as const,
});

// ============================================
// Error Metrics
// ============================================

export const errorsTotal = new client.Counter({
  name: 'allylab_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'code'] as const,
});

// ============================================
// Utility Functions
// ============================================

/**
 * Get all metrics in Prometheus text format
 */
export async function getMetrics(): Promise<string> {
  return client.register.metrics();
}

/**
 * Get metrics content type header
 */
export function getMetricsContentType(): string {
  return client.register.contentType;
}

/**
 * Record HTTP request metrics
 */
export function recordHttpRequest(
  method: string,
  path: string,
  status: number,
  durationSeconds: number
): void {
  const normalizedPath = normalizePath(path);
  httpRequestsTotal.inc({ method, path: normalizedPath, status: String(status) });
  httpRequestDuration.observe({ method, path: normalizedPath, status: String(status) }, durationSeconds);
}

/**
 * Record scan completion
 */
export function recordScan(
  viewport: string,
  status: 'success' | 'error' | 'timeout',
  durationSeconds: number,
  violations?: { critical?: number; serious?: number; moderate?: number; minor?: number }
): void {
  scansTotal.inc({ viewport, status });
  scanDuration.observe({ viewport }, durationSeconds);

  if (violations) {
    if (violations.critical) violationsTotal.inc({ severity: 'critical' }, violations.critical);
    if (violations.serious) violationsTotal.inc({ severity: 'serious' }, violations.serious);
    if (violations.moderate) violationsTotal.inc({ severity: 'moderate' }, violations.moderate);
    if (violations.minor) violationsTotal.inc({ severity: 'minor' }, violations.minor);
  }
}

/**
 * Update browser pool metrics
 */
export function updateBrowserPoolMetrics(
  active: number,
  idle: number,
  waiting: number
): void {
  browserPoolSize.set({ state: 'active' }, active);
  browserPoolSize.set({ state: 'idle' }, idle);
  browserPoolWaiting.set(waiting);
}

/**
 * Record cache operation
 */
export function recordCacheOperation(
  cacheName: string,
  hit: boolean,
  currentSize?: number
): void {
  if (hit) {
    cacheHits.inc({ cache: cacheName });
  } else {
    cacheMisses.inc({ cache: cacheName });
  }

  if (currentSize !== undefined) {
    cacheSize.set({ cache: cacheName }, currentSize);
  }
}

/**
 * Record an error
 */
export function recordError(type: string, code?: string): void {
  errorsTotal.inc({ type, code: code || 'unknown' });
}

/**
 * Normalize request path for metrics (removes dynamic segments)
 */
function normalizePath(path: string): string {
  // Remove query parameters
  const basePath = path.split('?')[0];

  // Normalize common dynamic segments
  return basePath
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id') // UUIDs
    .replace(/\/\d+/g, '/:id') // Numeric IDs
    .replace(/\/[0-9a-f]{24}/gi, '/:id'); // MongoDB ObjectIds
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics(): void {
  client.register.resetMetrics();
}

// Export the registry for advanced use cases
export { client };
