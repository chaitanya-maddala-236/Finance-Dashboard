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
