import * as authController from './auth.controller.js';

const registerSchema = {
  schema: {
    tags: ['Auth'],
    summary: 'Register a new user',
    body: {
      type: 'object',
      required: ['name', 'email', 'password'],
      additionalProperties: false,
      properties: {
        name: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
      },
    },
    response: {
      201: {
        description: 'User registered',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

const loginSchema = {
  schema: {
    tags: ['Auth'],
    summary: 'Login with email and password',
    body: {
      type: 'object',
      required: ['email', 'password'],
      additionalProperties: false,
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 1 },
      },
    },
    response: {
      200: {
        description: 'Login successful',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default async function authRoutes(fastify) {
  fastify.post('/register', {
    ...registerSchema,
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, authController.register);

  fastify.post('/login', {
    ...loginSchema,
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, authController.login);
}
