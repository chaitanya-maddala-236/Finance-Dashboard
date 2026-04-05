import jwt from 'jsonwebtoken';

/**
 * Fastify preHandler hook — verifies the JWT Bearer token.
 * Attaches the decoded payload to request.user.
 */
export async function authenticate(request, reply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = authHeader.slice(7);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return reply.status(401).send({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token',
    });
  }

  request.user = decoded;
}
