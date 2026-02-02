import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { runScan } from '../services/scanner.js';
import { triggerWebhooks } from '../services/webhooks.js';
import type { ScanRequest } from '../types/index.js';

export async function scanJsonRoutes(server: FastifyInstance) {
  server.post('/scan/json', async (request: FastifyRequest<{ Body: ScanRequest }>, reply: FastifyReply) => {
    const { url, standard = 'wcag21aa', includeWarnings = false, viewport, auth } = request.body;

    if (!url) {
      return reply.status(400).send({ error: 'URL is required' });
    }

    try {
      const result = await runScan({
        url,
        standard,
        viewport,
        includeWarnings,
        auth,
      });

      // Trigger webhooks on scan completion
      triggerWebhooks('scan.completed', {
        scanUrl: url,
        score: result.score,
        totalIssues: result.totalIssues,
        critical: result.findings.filter(f => f.impact === 'critical').length,
        serious: result.findings.filter(f => f.impact === 'serious').length,
        moderate: result.findings.filter(f => f.impact === 'moderate').length,
        minor: result.findings.filter(f => f.impact === 'minor').length,
      });

      // Trigger if critical issues found
      const criticalCount = result.findings.filter(f => f.impact === 'critical').length;
      if (criticalCount > 0) {
        triggerWebhooks('critical.found', {
          scanUrl: url,
          score: result.score,
          critical: criticalCount,
        });
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed';
      
      // Trigger webhook on scan failure
      triggerWebhooks('scan.failed', {
        scanUrl: url,
        error: message,
      });

      return reply.status(500).send({ error: message });
    }
  });
}