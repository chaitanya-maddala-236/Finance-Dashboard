import * as usersService from './users.service.js';
import { successResponse } from '../../utils/response.js';

export async function listUsers(request, reply) {
  const { page = 1, limit = 10, role, status } = request.query;
  const result = await usersService.listUsers(request.server.prisma, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    role,
    status,
  });
  return successResponse(reply, result, 'Users retrieved successfully');
}

export async function getUserById(request, reply) {
  const { id } = request.params;
  const user = await usersService.getUserById(request.server.prisma, id);
  return successResponse(reply, user, 'User retrieved successfully');
}

export async function updateUser(request, reply) {
  const { id } = request.params;
  const user = await usersService.updateUser(
    request.server.prisma,
    id,
    request.body,
    request.user
  );
  return successResponse(reply, user, 'User updated successfully');
}

export async function deactivateUser(request, reply) {
  const { id } = request.params;
  const user = await usersService.deactivateUser(
    request.server.prisma,
    id,
    request.user.sub
  );
  return successResponse(reply, user, 'User deactivated successfully');
}

export async function getMe(request, reply) {
  const user = await usersService.getMe(request.server.prisma, request.user.sub);
  return successResponse(reply, user, 'Profile retrieved successfully');
}
