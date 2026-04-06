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

export async function getCategories(request, reply) {
  const { startDate, endDate } = request.query;
  const data = await dashboardService.getDashboardCategories(
    request.server.prisma,
    request.user,
    { startDate, endDate }
  );
  return successResponse(reply, data, 'Dashboard categories retrieved successfully');
}

export async function getRecent(request, reply) {
  const { startDate, endDate, limit } = request.query;
  const data = await dashboardService.getDashboardRecent(
    request.server.prisma,
    request.user,
    { startDate, endDate, limit }
  );
  return successResponse(reply, data, 'Dashboard recent records retrieved successfully');
}

export async function getTrends(request, reply) {
  const { year, period, startDate, endDate } = request.query;
  const data = await dashboardService.getDashboardTrends(
    request.server.prisma,
    request.user,
    { year, period, startDate, endDate }
  );
  return successResponse(reply, data, 'Dashboard trends retrieved successfully');
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
