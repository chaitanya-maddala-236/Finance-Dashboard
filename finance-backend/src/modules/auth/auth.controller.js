import { registerUser, loginUser, getMe } from './auth.service.js';

export async function register(request, reply) {
  const user = await registerUser(request.server.prisma, request.body);
  return reply.status(201).send({
    success: true,
    message: 'User registered successfully',
    data: user,
  });
}

export async function login(request, reply) {
  const result = await loginUser(request.server.prisma, request.body);
  return reply.status(200).send({
    success: true,
    message: 'Login successful',
    data: result,
  });
}

export async function me(request, reply) {
  const user = await getMe(request.server.prisma, request.user.sub);
  return reply.status(200).send({
    success: true,
    message: 'User retrieved successfully',
    data: user,
  });
}

