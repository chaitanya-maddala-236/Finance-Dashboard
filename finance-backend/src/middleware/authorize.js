import { ForbiddenError } from '../utils/errors.js';

const ROLE_HIERARCHY = {
  VIEWER: 1,
  ANALYST: 2,
  ADMIN: 3,
};

/**
 * Returns a Fastify preHandler hook that checks if the authenticated user
 * has one of the allowed roles.
 *
 * Usage: preHandler: [authenticate, authorize('ADMIN')]
 *        preHandler: [authenticate, authorize('ANALYST', 'ADMIN')]
 *
 * @param {...string} roles - Allowed roles
 */
export function authorize(...roles) {
  return async function (request) {
    const userRole = request.user?.role;

    if (!userRole) {
      throw new ForbiddenError('Access denied: no role found');
    }

    if (!roles.includes(userRole)) {
      throw new ForbiddenError(
        `Access denied: requires one of [${roles.join(', ')}]`
      );
    }
  };
}

/**
 * Returns a preHandler hook that enforces a minimum role level.
 * e.g. authorizeMinRole('ANALYST') allows ANALYST and ADMIN.
 *
 * @param {string} minRole
 */
export function authorizeMinRole(minRole) {
  return async function (request) {
    const userRole = request.user?.role;
    const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
    const minLevel = ROLE_HIERARCHY[minRole] ?? 0;

    if (userLevel < minLevel) {
      throw new ForbiddenError(
        `Access denied: requires at least ${minRole} role`
      );
    }
  };
}
