import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { CreateScheduleRequest, UpdateScheduleRequest } from '../types/schedule';
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleHistory,
  runScheduleNow,
} from '../services/scheduler';

export async function scheduleRoutes(fastify: FastifyInstance) {
  // List all schedules
  fastify.get('/schedules', async (_request: FastifyRequest, reply: FastifyReply) => {
    const schedules = getAllSchedules();
    return reply.send({ schedules });
  });

  // Get single schedule
  fastify.get<{ Params: { id: string } }>(
    '/schedules/:id',
    async (request, reply) => {
      const schedule = getScheduleById(request.params.id);
      if (!schedule) {
        return reply.status(404).send({ error: 'Schedule not found' });
      }
      return reply.send(schedule);
    }
  );

  // Create schedule
  fastify.post<{ Body: CreateScheduleRequest }>(
    '/schedules',
    async (request, reply) => {
      const { url, frequency } = request.body;

      if (!url || !frequency) {
        return reply.status(400).send({ error: 'url and frequency are required' });
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return reply.status(400).send({ error: 'Invalid URL' });
      }

      // Validate frequency
      const validFrequencies = ['hourly', 'daily', 'weekly', 'monthly'];
      if (!validFrequencies.includes(frequency)) {
        return reply.status(400).send({ 
          error: `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}` 
        });
      }

      const schedule = createSchedule(url, frequency);
      return reply.status(201).send(schedule);
    }
  );

  // Update schedule
  fastify.patch<{ Params: { id: string }; Body: UpdateScheduleRequest }>(
    '/schedules/:id',
    async (request, reply) => {
      const { id } = request.params;
      const updates = request.body;

      const schedule = updateSchedule(id, updates);
      if (!schedule) {
        return reply.status(404).send({ error: 'Schedule not found' });
      }

      return reply.send(schedule);
    }
  );

  // Delete schedule
  fastify.delete<{ Params: { id: string } }>(
    '/schedules/:id',
    async (request, reply) => {
      const deleted = deleteSchedule(request.params.id);
      if (!deleted) {
        return reply.status(404).send({ error: 'Schedule not found' });
      }
      return reply.send({ success: true });
    }
  );

  // Get schedule run history
  fastify.get<{ Params: { id: string } }>(
    '/schedules/:id/history',
    async (request, reply) => {
      const schedule = getScheduleById(request.params.id);
      if (!schedule) {
        return reply.status(404).send({ error: 'Schedule not found' });
      }

      const history = getScheduleHistory(request.params.id);
      return reply.send({ history });
    }
  );

  // Run schedule immediately
  fastify.post<{ Params: { id: string } }>(
    '/schedules/:id/run',
    async (request, reply) => {
      const result = await runScheduleNow(request.params.id);
      if (!result) {
        return reply.status(404).send({ error: 'Schedule not found' });
      }
      return reply.send(result);
    }
  );
}