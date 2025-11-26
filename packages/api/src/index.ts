import { createServer } from './server.js';
import { config } from './config/env.js';

async function main() {
  const server = await createServer();

  try {
    await server.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 AllyLab API running on http://localhost:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();