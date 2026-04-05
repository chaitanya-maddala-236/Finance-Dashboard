import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as usersController from './users.controller.js';

const userResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    role: { type: 'string' },
    status: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

const successWithUser = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    data: userResponseSchema,
  },
};

export default async function usersRoutes(fastify) {
  // GET /users/me — get own profile (any authenticated user)
  fastify.get(
    '/me',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        response: { 200: successWithUser },
      },
      preHandler: [authenticate],
    },
    usersController.getMe
  );

  // GET /users — list all users (ADMIN only)
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Users'],
        summary: 'List all users (Admin only)',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          },
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
                  users: { type: 'array', items: userResponseSchema },
                  pagination: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      totalPages: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      preHandler: [authenticate, authorize('ADMIN')],
    },
    usersController.listUsers
  );

  // GET /users/:id — get user by id (ADMIN only)
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get a user by ID (Admin only)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: { 200: successWithUser },
      },
      preHandler: [authenticate, authorize('ADMIN')],
    },
    usersController.getUserById
  );

  // PATCH /users/:id — update user (ADMIN only)
  fastify.patch(
    '/:id',
    {
      schema: {
        tags: ['Users'],
        summary: 'Update a user (Admin only)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
            password: { type: 'string', minLength: 8, maxLength: 100 },
          },
          additionalProperties: false,
        },
        response: { 200: successWithUser },
      },
      preHandler: [authenticate, authorize('ADMIN')],
    },
    usersController.updateUser
  );

  // DELETE /users/:id — deactivate user (ADMIN only)
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['Users'],
        summary: 'Deactivate a user (Admin only)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: { 200: successWithUser },
      },
      preHandler: [authenticate, authorize('ADMIN')],
    },
    usersController.deactivateUser
  );
}
