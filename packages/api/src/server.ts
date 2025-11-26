import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initScheduler, shutdownScheduler } from './services/scheduler.js';
import { registerRoutes } from './routes/index.js';
import { config } from './config/env.js';

export async function createServer() {
  const server = Fastify({
    logger: config.nodeEnv === 'development' 
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          },
        }
      : true,
  });

  await server.register(cors, {
    origin: true,
    credentials: true,
  });

  await registerRoutes(server);
  
  // Initialize scheduler
  initScheduler();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    shutdownScheduler();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    shutdownScheduler();
    process.exit(0);
  });

  return server;
}