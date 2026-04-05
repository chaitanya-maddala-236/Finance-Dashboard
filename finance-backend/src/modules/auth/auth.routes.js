import * as authController from './auth.controller.js';

const registerSchema = {
  schema: {
    tags: ['Auth'],
    summary: 'Register a new user',
    body: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 100 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 100 },
      },
      additionalProperties: false,
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
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 1 },
      },
      additionalProperties: false,
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
  fastify.post('/register', registerSchema, authController.register);
  fastify.post('/login', loginSchema, authController.login);
}
