import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Register a new user.
 */
export async function registerUser(prisma, { name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const error = new Error('Email already in use');
    error.statusCode = 409;
    throw error;
  }

  // BCRYPT_ROUNDS should be 12+ in production
  // Set to 4 in .env.test for faster test runs
  const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
  const hashedPassword = await bcrypt.hash(password, rounds);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'VIEWER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Generate an access token and a long-lived refresh token, storing the
 * refresh token in the database.
 */
export async function generateTokens(prisma, user) {
  const accessToken = jwt.sign(
    { sub: user.id, userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

/**
 * Login a user and return access + refresh tokens.
 */
export async function loginUser(prisma, { email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (user.status === 'INACTIVE') {
    const error = new Error('Account is deactivated');
    error.statusCode = 401;
    throw error;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const { password: _, ...userWithoutPassword } = user;
  const tokens = await generateTokens(prisma, user);

  return {
    // Keep 'token' for backward compatibility with existing clients
    token: tokens.accessToken,
    ...tokens,
    user: userWithoutPassword,
  };
}

/**
 * Rotate a refresh token: revoke the old one and issue new access + refresh tokens.
 */
export async function refreshAccessToken(prisma, refreshToken) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!stored || stored.isRevoked) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }

  if (new Date() > stored.expiresAt) {
    const error = new Error('Refresh token expired');
    error.statusCode = 401;
    throw error;
  }

  if (stored.user.status === 'INACTIVE') {
    const error = new Error('Account is deactivated');
    error.statusCode = 401;
    throw error;
  }

  // Rotate: revoke old token, issue new tokens
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { isRevoked: true },
  });

  return generateTokens(prisma, stored.user);
}

/**
 * Revoke a refresh token (logout).
 */
export async function logoutUser(prisma, refreshToken) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { isRevoked: true },
  });
}

