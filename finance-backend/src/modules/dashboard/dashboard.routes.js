import { authenticate } from '../../middleware/authenticate.js';
import * as dashboardController from './dashboard.controller.js';

export default async function dashboardRoutes(fastify) {
  // GET /dashboard/summary
  fastify.get(
    '/summary',
    {
      schema: {
        tags: ['Dashboard'],
        summary: 'Get financial summary',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
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
                  summary: {
                    type: 'object',
                    properties: {
                      totalIncome: { type: 'number' },
                      totalExpense: { type: 'number' },
                      netBalance: { type: 'number' },
                      totalRecords: { type: 'integer' },
                      incomeCount: { type: 'integer' },
                      expenseCount: { type: 'integer' },
                    },
                  },
                  recentRecords: { type: 'array' },
                  categoryBreakdown: { type: 'array' },
                },
              },
            },
          },
        },
      },
      preHandler: [authenticate],
    },
    dashboardController.getSummary
  );

  // GET /dashboard/categories
  fastify.get(
    '/categories',
    {
      schema: {
        tags: ['Dashboard'],
        summary: 'Get dashboard category breakdown',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
      },
      preHandler: [authenticate],
    },
    dashboardController.getCategories
  );

  // GET /dashboard/recent
  fastify.get(
    '/recent',
    {
      schema: {
        tags: ['Dashboard'],
        summary: 'Get recent records for dashboard',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
          },
        },
      },
      preHandler: [authenticate],
    },
    dashboardController.getRecent
  );

  // GET /dashboard/trends
  fastify.get(
    '/trends',
    {
      schema: {
        tags: ['Dashboard'],
        summary: 'Get dashboard trends',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            year: { type: 'integer', minimum: 2000, maximum: 2100 },
            period: { type: 'string', enum: ['monthly', 'daily'], default: 'monthly' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
      },
      preHandler: [authenticate],
    },
    dashboardController.getTrends
  );

  // GET /dashboard/monthly
  fastify.get(
    '/monthly',
    {
      schema: {
        tags: ['Dashboard'],
        summary: 'Get monthly income vs expense breakdown',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            year: { type: 'integer', minimum: 2000, maximum: 2100 },
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
                  year: { type: 'integer' },
                  breakdown: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        month: { type: 'string' },
                        income: { type: 'number' },
                        expense: { type: 'number' },
                        net: { type: 'number' },
                      },
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
    dashboardController.getMonthlyBreakdown
  );
}
