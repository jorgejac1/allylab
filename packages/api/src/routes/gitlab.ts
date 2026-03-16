import type { FastifyInstance } from 'fastify';
import { verifyFixes } from '../utils/verify-fixes';

interface VerifyBody {
  url: string;
  findingIds: string[];
  mrIid: number;
  projectPath: string;
  standard?: string;
  viewport?: string;
}

export default async function gitlabRoutes(server: FastifyInstance) {
  server.post<{ Body: VerifyBody }>('/gitlab/verify', async (request, reply) => {
    const { url, findingIds, mrIid, projectPath, standard, viewport } = request.body;

    if (!url || !findingIds || findingIds.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: url, findingIds',
      });
    }

    try {
      const result = await verifyFixes(server, {
        url,
        findingIds,
        standard,
        viewport,
      });

      return {
        ...result,
        mrIid,
        projectPath,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  });
}
