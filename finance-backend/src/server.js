import dotenv from 'dotenv';
dotenv.config();

import { buildApp } from './app.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const fastify = await buildApp();

  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 Finance Dashboard API running at http://${HOST}:${PORT}`);
    console.log(`📖 Swagger docs available at http://${HOST}:${PORT}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

start();
