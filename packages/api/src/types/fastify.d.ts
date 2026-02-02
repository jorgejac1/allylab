import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /** Request start time for metrics tracking */
    startTime?: bigint;
    /** Request correlation ID for tracing */
    requestId?: string;
  }
}
