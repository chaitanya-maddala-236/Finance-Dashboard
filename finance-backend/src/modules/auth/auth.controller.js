import { registerUser, loginUser } from './auth.service.js';
import { successResponse } from '../../utils/response.js';

export async function register(request, reply) {
  const user = await registerUser(request.server.prisma, request.body);
  return successResponse(reply, user, 'User registered successfully', 201);
}

export async function login(request, reply) {
  const result = await loginUser(request.server.prisma, request.body);
  return successResponse(reply, result, 'Login successful');
}
