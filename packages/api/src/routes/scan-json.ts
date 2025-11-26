import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { runScan } from '../services/scanner.js';
import type { ScanRequest } from '../types/index.js';

export async function scanJsonRoutes(server: FastifyInstance) {
  server.post('/scan/json', async (request: FastifyRequest<{ Body: ScanRequest }>, reply: FastifyReply) => {
    const { url, standard = 'wcag21aa', includeWarnings = false } = request.body;

    if (!url) {
      return reply.status(400).send({ error: 'URL is required' });
    }

    try {
      const result = await runScan({
        url,
        standard,
        includeWarnings,
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed';
      return reply.status(500).send({ error: message });
    }
  });
}