import * as recordsService from './records.service.js';
import { successResponse } from '../../utils/response.js';

export async function listRecords(request, reply) {
  const { page = 1, limit = 10, type, category, startDate, endDate, includeDeleted } = request.query;
  const result = await recordsService.listRecords(
    request.server.prisma,
    {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      type,
      category,
      startDate,
      endDate,
      includeDeleted: includeDeleted === 'true',
    },
    request.user
  );
  return successResponse(reply, result, 'Records retrieved successfully');
}

export async function getRecordById(request, reply) {
  const { id } = request.params;
  const record = await recordsService.getRecordById(request.server.prisma, id, request.user);
  return successResponse(reply, record, 'Record retrieved successfully');
}

export async function createRecord(request, reply) {
  const record = await recordsService.createRecord(
    request.server.prisma,
    request.body,
    request.user
  );
  return successResponse(reply, record, 'Record created successfully', 201);
}

export async function updateRecord(request, reply) {
  const { id } = request.params;
  const record = await recordsService.updateRecord(
    request.server.prisma,
    id,
    request.body,
    request.user
  );
  return successResponse(reply, record, 'Record updated successfully');
}

export async function deleteRecord(request, reply) {
  const { id } = request.params;
  const record = await recordsService.deleteRecord(request.server.prisma, id, request.user);
  return successResponse(reply, record, 'Record deleted successfully');
}
