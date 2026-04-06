import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import bcrypt from 'bcryptjs';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Get paginated list of users.
 */
export async function listUsers(prisma, { page = 1, limit = 10, role, status }) {
  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single user by ID.
 */
export async function getUserById(prisma, id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });

  if (!user) {
    throw new NotFoundError(`User with id '${id}' not found`);
  }

  return user;
}

/**
 * Update a user's name, role, or status.
 * Only ADMIN can change roles. Users can update their own name.
 */
export async function updateUser(prisma, id, updates, requestingUser) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundError(`User with id '${id}' not found`);
  }

  // Only admin can change roles
  if (updates.role && requestingUser.role !== 'ADMIN') {
    throw new ForbiddenError('Only admins can change user roles');
  }

  // Only admin can change status
  if (updates.status && requestingUser.role !== 'ADMIN') {
    throw new ForbiddenError('Only admins can change user status');
  }

  // Build update payload
  const data = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.role !== undefined) data.role = updates.role;
  if (updates.status !== undefined) data.status = updates.status;

  if (updates.password) {
    // BCRYPT_ROUNDS should be 12+ in production
    // Set to 4 in .env.test for faster test runs
    const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
    data.password = await bcrypt.hash(updates.password, rounds);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  });

  return updated;
}

/**
 * Deactivate a user (soft delete via status = INACTIVE).
 * Admin cannot deactivate themselves.
 * Revoking all active refresh tokens immediately invalidates their sessions.
 */
export async function deactivateUser(prisma, id, requestingUserId) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundError(`User with id '${id}' not found`);
  }

  if (id === requestingUserId) {
    throw new ForbiddenError('You cannot deactivate your own account');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: 'INACTIVE' },
    select: USER_SELECT,
  });

  // Revoke all active refresh tokens to immediately invalidate sessions
  await prisma.refreshToken.updateMany({
    where: { userId: id, isRevoked: false },
    data: { isRevoked: true },
  });

  return updated;
}

/**
 * Get the currently authenticated user's profile.
 */
export async function getMe(prisma, id) {
  return getUserById(prisma, id);
}
