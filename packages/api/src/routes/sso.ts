import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JsonStorage } from '../utils/storage.js';
import type { SSOConnection } from '../types/sso.js';
import { DEFAULT_SSO_CONFIG } from '../types/sso.js';
import { randomUUID } from 'crypto';

const ssoStore = new JsonStorage<SSOConnection>({ filename: 'sso.json' });

export async function ssoRoutes(fastify: FastifyInstance) {
  // GET /sso/config - Get SSO config for org
  fastify.get('/sso/config', async (_request: FastifyRequest, reply: FastifyReply) => {
    // get org ID from auth context or query
    const connections = await ssoStore.getAll();
    const connection = connections[0]; // Single tenant for now
    return reply.send({ success: true, data: connection || null });
  });

  // PUT /sso/config - Create or update SSO config
  fastify.put<{ Body: { config: Partial<SSOConnection['config']> } }>(
    '/sso/config',
    async (request, reply) => {
      const { config } = request.body;
      const connections = await ssoStore.getAll();
      let connection = connections[0];

      if (connection) {
        connection = { ...connection, config: { ...connection.config, ...config }, updatedAt: new Date().toISOString() };
        await ssoStore.set(connection.id, connection);
      } else {
        connection = {
          id: `sso_${randomUUID().slice(0, 8)}`,
          organizationId: 'org_default',
          config: { ...DEFAULT_SSO_CONFIG, ...config },
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        await ssoStore.set(connection.id, connection);
      }

      return reply.send({ success: true, data: connection });
    }
  );

  // POST /sso/test - Test SSO connection
  fastify.post('/sso/test', async (_request, reply) => {
    const connections = await ssoStore.getAll();
    const connection = connections[0];
    if (!connection) {
      return reply.status(404).send({ success: false, error: 'No SSO config found' });
    }

    // Validate config fields
    const { config } = connection;
    const errors: string[] = [];
    if (!config.entityId) errors.push('Entity ID is required');
    if (!config.ssoUrl) errors.push('SSO URL is required');
    if (!config.certificate) errors.push('Certificate is required');

    if (errors.length > 0) {
      const result = { success: false, message: errors.join(', ') };
      connection.lastTestedAt = new Date().toISOString();
      connection.testResult = result;
      await ssoStore.set(connection.id, connection);
      return reply.send({ success: true, data: result });
    }

    // Simulate successful test
    const result = { success: true, message: 'SSO configuration validated successfully' };
    connection.lastTestedAt = new Date().toISOString();
    connection.testResult = result;
    connection.status = 'active';
    await ssoStore.set(connection.id, connection);

    return reply.send({ success: true, data: result });
  });

  // DELETE /sso/config - Disable SSO
  fastify.delete('/sso/config', async (_request, reply) => {
    const connections = await ssoStore.getAll();
    const connection = connections[0];
    if (connection) {
      connection.status = 'inactive';
      connection.config.enabled = false;
      connection.updatedAt = new Date().toISOString();
      await ssoStore.set(connection.id, connection);
    }
    return reply.send({ success: true, message: 'SSO disabled' });
  });
}
