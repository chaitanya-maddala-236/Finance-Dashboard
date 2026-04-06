import { register, login, me } from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const userSchema = {
  type: 'object',
  properties: {
    id:        { type: 'string' },
    name:      { type: 'string' },
    email:     { type: 'string' },
    role:      { type: 'string' },
    status:    { type: 'string' },
    createdAt: { type: 'string' },
  },
};

const successWithUser = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    data: userSchema,
  },
};

export default async function authRoutes(fastify, _options) {

  // POST /auth/register
  fastify.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user',
      body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name:     { type: 'string', minLength: 1 },
          email:    { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        }
      },
      response: {
        201: successWithUser,
      },
    }
  }, register);

  // POST /auth/login
  fastify.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Login and receive JWT token',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user:  userSchema,
              },
            },
          },
        },
      },
    },
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, login);

  // GET /auth/me
  fastify.get('/me', {
    schema: {
      tags: ['Auth'],
      summary: 'Get current authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: successWithUser,
      },
    },
    preHandler: [authenticate]
  }, me);
}

