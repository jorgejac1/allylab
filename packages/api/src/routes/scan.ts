import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { runScan } from '../services/scanner.js';
import { triggerWebhooks } from '../services/webhooks.js';
import { sendSSE, endSSE } from '../utils/sse.js';
import type { ScanRequest } from '../types/index.js';

export async function scanRoutes(server: FastifyInstance) {
  server.post('/scan', async (request: FastifyRequest<{ Body: ScanRequest }>, reply: FastifyReply) => {
    const { 
      url, 
      standard = 'wcag21aa', 
      viewport = 'desktop', 
      includeWarnings = false,
      includeCustomRules = true,
    } = request.body;

    if (!url) {
      return reply.status(400).send({ error: 'URL is required' });
    }

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    try {
      sendSSE(reply, 'status', { message: 'Starting scan...', phase: 'init' });

      const result = await runScan({
        url,
        standard,
        viewport,
        includeWarnings,
        includeCustomRules,
        onProgress: (progress) => {
          sendSSE(reply, 'progress', progress);
        },
        onFinding: (finding) => {
          sendSSE(reply, 'finding', finding);
        },
      });

      sendSSE(reply, 'complete', result);

      // Trigger webhooks on scan completion
      triggerWebhooks('scan.completed', {
        scanUrl: url,
        score: result.score,
        totalIssues: result.totalIssues,
        critical: result.findings.filter(f => f.impact === 'critical').length,
        serious: result.findings.filter(f => f.impact === 'serious').length,
        moderate: result.findings.filter(f => f.impact === 'moderate').length,
        minor: result.findings.filter(f => f.impact === 'minor').length,
        customRulesCount: result.customRulesCount,
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      sendSSE(reply, 'error', { message });

      // Trigger webhook on scan failure
      triggerWebhooks('scan.failed', {
        scanUrl: url,
        error: message,
      });
    } finally {
      endSSE(reply);
    }
  });
}