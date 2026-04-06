import { createRequire } from 'module';
import Fastify from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

// Plugins
import prismaPlugin from './plugins/prisma.js';
import swaggerPlugin from './plugins/swagger.js';

// Routes
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import recordsRoutes from './modules/records/records.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

export async function buildApp(opts = {}) {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
    ...opts,
  });

  // Register plugins (order matters: swagger before routes)
  await fastify.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => ({
      success: false,
      message: `Too many requests. Please try again after ${context.after}.`,
      errors: null,
    }),
  });
  await fastify.register(swaggerPlugin);
  await fastify.register(prismaPlugin);

  // Root route
  fastify.get('/', async (request, reply) => {
    return reply.send({
      success: true,
      message: 'Finance Dashboard API is running 🚀',
      version,
      environment: process.env.NODE_ENV || 'development',
      documentation: '/docs',
      endpoints: {
        auth:      '/auth',
        users:     '/users',
        records:   '/records',
        dashboard: '/dashboard'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Health check
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async (_request, reply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Register route modules
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(usersRoutes, { prefix: '/users' });
  await fastify.register(recordsRoutes, { prefix: '/records' });
  await fastify.register(dashboardRoutes, { prefix: '/dashboard' });

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    // Fastify built-in schema validation error
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        message: 'Validation failed',
        errors: error.validation,
      });
    }

    // Prisma unique constraint violation (P2002) — duplicate email
    if (error.code === 'P2002') {
      return reply.status(409).send({
        success: false,
        message: 'Resource already exists. Email may already be in use.',
      });
    }

    // Prisma record not found (P2025)
    if (error.code === 'P2025') {
      return reply.status(404).send({
        success: false,
        message: 'Resource not found',
      });
    }

    // Custom AppError or any error with statusCode set manually
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.status(error.statusCode).send({
        success: false,
        message: error.message,
      });
    }

    // Fastify's own HttpError (from @fastify/error or http-errors)
    if (error.status && error.status >= 400 && error.status < 500) {
      return reply.status(error.status).send({
        success: false,
        message: error.message,
      });
    }

    // Unknown / server error
    fastify.log.error(error);
    return reply.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  });

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      success: false,
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  return fastify;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const HOST = process.env.HOST || '0.0.0.0';

  const start = async () => {
    const fastify = await buildApp();
    try {
      await fastify.listen({ port: PORT, host: HOST });
      console.log(`🚀 Finance Dashboard API running at http://${HOST}:${PORT}`);
      console.log(`📖 Swagger docs available at http://${HOST}:${PORT}/docs`);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', async () => process.exit(0));
  process.on('SIGINT', async () => process.exit(0));

  start();
}
