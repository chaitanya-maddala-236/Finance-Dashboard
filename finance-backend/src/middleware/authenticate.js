import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response.js';

/**
 * Fastify preHandler hook — verifies the JWT Bearer token.
 * Attaches the decoded payload to request.user.
 */
export async function authenticate(request, reply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(reply, 'Missing or invalid Authorization header', 401);
  }

  const token = authHeader.slice(7);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return errorResponse(
      reply,
      err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token',
      401
    );
  }

  request.user = decoded;
}
