import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';
import { scanRoutes } from './scan';
import { scanJsonRoutes } from './scan-json';
import { jiraRoutes } from './jira';
import { scheduleRoutes } from './schedules';
import { exportRoutes } from './export';
import { webhookRoutes } from './webhooks';
import { crawlRoutes } from './crawl';
import { githubRoutes } from './github.js';
import { fixesRoutes } from './fixes.js';
import { trendsRoutes } from './trends.js';
import { rulesRoutes } from './rules.js';
import { userRoutes } from './users.js';
import { authRoutes } from './auth.js';

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes);
  await fastify.register(healthRoutes);
  await fastify.register(scanRoutes);
  await fastify.register(scanJsonRoutes);
  await fastify.register(jiraRoutes);
  await fastify.register(scheduleRoutes);
  await fastify.register(exportRoutes);
  await fastify.register(webhookRoutes);
  await fastify.register(crawlRoutes);
  await fastify.register(githubRoutes);
  await fastify.register(fixesRoutes);
  await fastify.register(trendsRoutes);
  await fastify.register(rulesRoutes);
  await fastify.register(userRoutes);
}