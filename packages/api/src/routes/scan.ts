import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { runScan } from '../services/scanner.js';
import { sendSSE, endSSE } from '../utils/sse.js';
import type { ScanRequest } from '../types/index.js';

export async function scanRoutes(server: FastifyInstance) {
  server.post('/scan', async (request: FastifyRequest<{ Body: ScanRequest }>, reply: FastifyReply) => {
    const { url, standard = 'wcag21aa', viewport = 'desktop', includeWarnings = false } = request.body;

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
        onProgress: (progress) => {
          sendSSE(reply, 'progress', progress);
        },
        onFinding: (finding) => {
          sendSSE(reply, 'finding', finding);
        },
      });

      sendSSE(reply, 'complete', result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      sendSSE(reply, 'error', { message });
    } finally {
      endSSE(reply);
    }
  });
}