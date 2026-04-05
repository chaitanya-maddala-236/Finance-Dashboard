import Fastify from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import { AppError } from './utils/errors.js';
import { errorResponse } from './utils/response.js';

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
    global: false, // only apply where config.rateLimit is set
  });
  await fastify.register(swaggerPlugin);
  await fastify.register(prismaPlugin);

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
    fastify.log.error(error);

    // Handle Fastify validation errors
    if (error.validation) {
      return errorResponse(
        reply,
        'Validation failed',
        400,
        error.validation
      );
    }

    // Handle our custom AppErrors
    if (error instanceof AppError) {
      return errorResponse(reply, error.message, error.statusCode);
    }

    // Prisma known request errors
    if (error.code === 'P2002') {
      return errorResponse(reply, 'A record with this value already exists', 409);
    }
    if (error.code === 'P2025') {
      return errorResponse(reply, 'Record not found', 404);
    }

    // Fallback
    const statusCode = error.statusCode || 500;
    const message =
      process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;

    return errorResponse(reply, message, statusCode);
  });

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    return errorResponse(reply, `Route ${request.method} ${request.url} not found`, 404);
  });

  return fastify;
}
