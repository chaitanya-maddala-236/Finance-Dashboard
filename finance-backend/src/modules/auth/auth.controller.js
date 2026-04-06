import { registerUser, loginUser } from './auth.service.js';
import { successResponse } from '../../utils/response.js';

export async function register(request, reply) {
  try {
    const user = await registerUser(request.server.prisma, request.body);
    return successResponse(reply, user, 'User registered successfully', 201);
  } catch (error) {
    throw error;
  }
}

export async function login(request, reply) {
  try {
    const result = await loginUser(request.server.prisma, request.body);
    return successResponse(reply, result, 'Login successful');
  } catch (error) {
    throw error;
  }
}
