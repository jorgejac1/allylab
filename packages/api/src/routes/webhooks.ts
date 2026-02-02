import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getAllWebhooks,
  getWebhookById,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
} from '../services/webhooks';
import type { WebhookCreateRequest, WebhookUpdateRequest } from '../types/webhook';
import { getPaginationFromQuery, paginate } from '../utils/pagination.js';

interface WebhookListQuery {
  limit?: string;
  offset?: string;
  page?: string;
}

export async function webhookRoutes(fastify: FastifyInstance) {
  // List all webhooks with pagination
  fastify.get<{ Querystring: WebhookListQuery }>(
    '/webhooks',
    async (request: FastifyRequest<{ Querystring: WebhookListQuery }>, reply: FastifyReply) => {
      const webhooks = getAllWebhooks();
      // Don't expose secrets
      const safeWebhooks = webhooks.map(wh => ({
        ...wh,
        secret: wh.secret ? '••••••••' : undefined,
      }));

      const pagination = getPaginationFromQuery(request.query as Record<string, unknown>);
      const result = paginate(safeWebhooks, pagination);

      return reply.send({
        webhooks: result.items,
        pagination: result.pagination,
      });
    }
  );

  // Get single webhook
  fastify.get<{ Params: { id: string } }>(
    '/webhooks/:id',
    async (request, reply) => {
      const webhook = getWebhookById(request.params.id);
      if (!webhook) {
        return reply.status(404).send({ error: 'Webhook not found' });
      }
      return reply.send({
        ...webhook,
        secret: webhook.secret ? '••••••••' : undefined,
      });
    }
  );

  // Create webhook
  fastify.post<{ Body: WebhookCreateRequest }>(
    '/webhooks',
    async (request, reply) => {
      const { name, url, events, secret } = request.body;

      if (!name || !url || !events || events.length === 0) {
        return reply.status(400).send({ 
          error: 'Missing required fields: name, url, events' 
        });
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return reply.status(400).send({ error: 'Invalid URL' });
      }

      const webhook = createWebhook({ name, url, events, secret });
      return reply.status(201).send(webhook);
    }
  );

  // Update webhook
  fastify.patch<{ Params: { id: string }; Body: WebhookUpdateRequest }>(
    '/webhooks/:id',
    async (request, reply) => {
      const webhook = updateWebhook(request.params.id, request.body);
      if (!webhook) {
        return reply.status(404).send({ error: 'Webhook not found' });
      }
      return reply.send(webhook);
    }
  );

  // Delete webhook
  fastify.delete<{ Params: { id: string } }>(
    '/webhooks/:id',
    async (request, reply) => {
      const deleted = deleteWebhook(request.params.id);
      if (!deleted) {
        return reply.status(404).send({ error: 'Webhook not found' });
      }
      return reply.send({ success: true });
    }
  );

  // Test webhook
  fastify.post<{ Params: { id: string } }>(
    '/webhooks/:id/test',
    async (request, reply) => {
      const result = await testWebhook(request.params.id);
      return reply.send(result);
    }
  );
}