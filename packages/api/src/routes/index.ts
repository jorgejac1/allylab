import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';
import { scanRoutes } from './scan';
import { scanJsonRoutes } from './scan-json';
import { jiraRoutes } from './jira';
import { scheduleRoutes } from './schedules';

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes);
  await fastify.register(scanRoutes);
  await fastify.register(scanJsonRoutes);
  await fastify.register(jiraRoutes);
  await fastify.register(scheduleRoutes);
}