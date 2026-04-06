import { authenticate } from '../../middleware/authenticate.js';
import { authorizeMinRole } from '../../middleware/authorize.js';
import * as recordsController from './records.controller.js';

const recordSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    amount: { type: 'number' },
    type: { type: 'string' },
    category: { type: 'string' },
    date: { type: 'string' },
    notes: { type: ['string', 'null'] },
    isDeleted: { type: 'boolean' },
    createdById: { type: 'string' },
    createdBy: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
      },
    },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

const successWithRecord = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    data: recordSchema,
  },
};

export default async function recordsRoutes(fastify) {
  // GET /records — list records (all authenticated users)
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Records'],
        summary: 'List financial records',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            includeDeleted: { type: 'string', enum: ['true', 'false'], default: 'false' },
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
                  records: { type: 'array', items: recordSchema },
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
      preHandler: [authenticate],
    },
    recordsController.listRecords
  );

  // GET /records/:id — get record by id
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Records'],
        summary: 'Get a record by ID',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: { 200: successWithRecord },
      },
      preHandler: [authenticate],
    },
    recordsController.getRecordById
  );

  // POST /records — create record (ADMIN only)
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Records'],
        summary: 'Create a financial record (Admin only)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['amount', 'type', 'category', 'date'],
          properties: {
            amount: { type: 'number', minimum: 0.01 },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string', minLength: 1, maxLength: 100 },
            date: { type: 'string', format: 'date' },
            notes: { type: 'string', maxLength: 500 },
          },
          additionalProperties: false,
        },
        response: { 201: successWithRecord },
      },
      preHandler: [authenticate, authorizeMinRole('ADMIN')],
    },
    recordsController.createRecord
  );

  // PATCH /records/:id — update record (ADMIN only)
  fastify.patch(
    '/:id',
    {
      schema: {
        tags: ['Records'],
        summary: 'Update a financial record (Admin only)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            amount: { type: 'number', minimum: 0.01 },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string', minLength: 1, maxLength: 100 },
            date: { type: 'string', format: 'date' },
            notes: { type: 'string', maxLength: 500 },
          },
          additionalProperties: false,
        },
        response: { 200: successWithRecord },
      },
      preHandler: [authenticate, authorizeMinRole('ADMIN')],
    },
    recordsController.updateRecord
  );

  // DELETE /records/:id — soft delete (ADMIN only)
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['Records'],
        summary: 'Soft-delete a financial record (Admin only)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: { 200: successWithRecord },
      },
      preHandler: [authenticate, authorizeMinRole('ADMIN')],
    },
    recordsController.deleteRecord
  );
}
