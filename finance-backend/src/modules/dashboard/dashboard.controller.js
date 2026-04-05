import * as dashboardService from './dashboard.service.js';
import { successResponse } from '../../utils/response.js';

export async function getSummary(request, reply) {
  const { startDate, endDate } = request.query;
  const data = await dashboardService.getSummary(
    request.server.prisma,
    request.user,
    { startDate, endDate }
  );
  return successResponse(reply, data, 'Dashboard summary retrieved successfully');
}

export async function getMonthlyBreakdown(request, reply) {
  const { year } = request.query;
  const data = await dashboardService.getMonthlyBreakdown(
    request.server.prisma,
    request.user,
    { year }
  );
  return successResponse(reply, data, 'Monthly breakdown retrieved successfully');
}
