import * as authService from './auth.service.js';
import { successResponse } from '../../utils/response.js';

export async function register(request, reply) {
  const { name, email, password } = request.body;
  const user = await authService.register(request.server.prisma, { name, email, password });
  return successResponse(reply, user, 'User registered successfully', 201);
}

export async function login(request, reply) {
  const { email, password } = request.body;
  const result = await authService.login(request.server.prisma, { email, password });
  return successResponse(reply, result, 'Login successful');
}
