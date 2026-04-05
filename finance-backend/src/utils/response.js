/**
 * Send a successful JSON response.
 * @param {import('fastify').FastifyReply} reply
 * @param {*} data
 * @param {string} message
 * @param {number} statusCode
 */
export function successResponse(reply, data, message = 'Success', statusCode = 200) {
  return reply.code(statusCode).send({
    success: true,
    message,
    data,
  });
}

/**
 * Send an error JSON response.
 * @param {import('fastify').FastifyReply} reply
 * @param {string} message
 * @param {number} statusCode
 * @param {*} errors
 */
export function errorResponse(reply, message = 'Error', statusCode = 400, errors = null) {
  const body = { success: false, message };
  if (errors !== null) {
    body.errors = errors;
  }
  return reply.code(statusCode).send(body);
}
