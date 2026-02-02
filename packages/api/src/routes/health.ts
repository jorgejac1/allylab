import type { FastifyInstance } from 'fastify';
import { getPoolStats } from '../services/browser.js';
import { getGitHubCacheStats } from '../services/github.js';
import { getMetrics, getMetricsContentType, updateBrowserPoolMetrics } from '../utils/metrics.js';

// Track server start time for uptime calculation
const startTime = Date.now();

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    heapUsedMB: number;
    heapTotalMB: number;
  };
  browser: {
    poolTotal: number;
    poolActive: number;
    poolIdle: number;
    poolWaiting: number;
    poolMaxPages: number;
  };
  cache: {
    github: Record<string, number>;
  };
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Determine overall health status based on metrics
 */
function determineStatus(memory: NodeJS.MemoryUsage, poolStats: ReturnType<typeof getPoolStats>): 'ok' | 'degraded' | 'unhealthy' {
  // Check memory usage (warn if heap is over 90% of limit)
  const heapPercent = (memory.heapUsed / memory.heapTotal) * 100;

  // Check if pool is at capacity with waiters
  const poolFull = poolStats.waiting > 0 && poolStats.active >= poolStats.maxPages;

  if (heapPercent > 95 || poolStats.waiting > 5) {
    return 'unhealthy';
  }

  if (heapPercent > 85 || poolFull) {
    return 'degraded';
  }

  return 'ok';
}

export async function healthRoutes(server: FastifyInstance) {
  // Simple health check (for load balancers)
  server.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'allylab-api',
      version: '1.0.0',
    };
  });

  // Detailed health check with metrics
  server.get<{ Reply: HealthStatus }>('/health/detailed', async () => {
    const uptimeSeconds = (Date.now() - startTime) / 1000;
    const memory = process.memoryUsage();
    const poolStats = getPoolStats();
    const githubCacheStats = getGitHubCacheStats();

    const status = determineStatus(memory, poolStats);

    return {
      status,
      timestamp: new Date().toISOString(),
      service: 'allylab-api',
      version: '1.0.0',
      uptime: {
        seconds: Math.floor(uptimeSeconds),
        formatted: formatUptime(uptimeSeconds),
      },
      memory: {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
        rss: memory.rss,
        heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      },
      browser: {
        poolTotal: poolStats.total,
        poolActive: poolStats.active,
        poolIdle: poolStats.idle,
        poolWaiting: poolStats.waiting,
        poolMaxPages: poolStats.maxPages,
      },
      cache: {
        github: githubCacheStats,
      },
    };
  });

  // Liveness probe (basic check that server is running)
  server.get('/health/live', async () => {
    return { status: 'ok' };
  });

  // Readiness probe (check if server can handle requests)
  server.get('/health/ready', async () => {
    const poolStats = getPoolStats();

    // Not ready if pool is completely full with waiters
    if (poolStats.waiting > 10) {
      return { status: 'not_ready', reason: 'browser_pool_overloaded' };
    }

    return { status: 'ready' };
  });

  // Prometheus metrics endpoint
  server.get('/metrics', async (_request, reply) => {
    // Update browser pool metrics before returning
    const poolStats = getPoolStats();
    updateBrowserPoolMetrics(poolStats.active, poolStats.idle, poolStats.waiting);

    const metrics = await getMetrics();
    return reply
      .header('Content-Type', getMetricsContentType())
      .send(metrics);
  });
}

// Export for testing
export { startTime, formatUptime, determineStatus };
