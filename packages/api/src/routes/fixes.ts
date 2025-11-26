import type { FastifyInstance } from 'fastify';
import { generateEnhancedFix } from '../services/ai-fixes.js';
import type { FixGenerationRequest } from '../types/fixes.js';

export async function fixesRoutes(fastify: FastifyInstance) {
  // Generate enhanced fix
  fastify.post<{ Body: FixGenerationRequest }>(
    '/fixes/generate',
    async (request, reply) => {
      const { finding, framework, context } = request.body;

      if (!finding || !finding.ruleId || !finding.html) {
        return reply.status(400).send({ 
          error: 'Missing required finding data' 
        });
      }

      try {
        const fix = await generateEnhancedFix({ finding, framework, context });

        if (fix) {
          return reply.send({ success: true, fix });
        } else {
          return reply.status(500).send({ 
            success: false, 
            error: 'Failed to generate fix. AI service may be unavailable.' 
          });
        }
      } catch (error) {
        return reply.status(500).send({ 
          success: false,
          error: error instanceof Error ? error.message : 'Fix generation failed' 
        });
      }
    }
  );
}