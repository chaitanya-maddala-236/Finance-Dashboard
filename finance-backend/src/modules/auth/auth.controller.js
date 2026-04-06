import { registerUser, loginUser, refreshAccessToken, logoutUser } from './auth.service.js';
import { successResponse } from '../../utils/response.js';

export async function register(request, reply) {
  const user = await registerUser(request.server.prisma, request.body);
  return successResponse(reply, user, 'User registered successfully', 201);
}

export async function login(request, reply) {
  const result = await loginUser(request.server.prisma, request.body);
  return successResponse(reply, result, 'Login successful');
}

export async function refresh(request, reply) {
  const { refreshToken } = request.body;
  const tokens = await refreshAccessToken(request.server.prisma, refreshToken);
  return successResponse(reply, tokens, 'Token refreshed successfully');
}

export async function logout(request, reply) {
  const { refreshToken } = request.body;
  await logoutUser(request.server.prisma, refreshToken);
  return successResponse(reply, null, 'Logged out successfully');
}
