import type { FastifyReply } from 'fastify';

export function sendSSE(reply: FastifyReply, event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  reply.raw.write(payload);
}

export function endSSE(reply: FastifyReply): void {
  reply.raw.end();
}