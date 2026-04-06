import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Register a new user. Role is always VIEWER for self-registration.
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

export async function generateTokens(prisma, user) {
  // Access token — short lived
  const accessToken = jwt.sign(
    { sub: user.id, userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  // Refresh token — long lived, stored in DB
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const refreshTokenExpiresDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30', 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + refreshTokenExpiresDays);

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
 * Login a user and return a JWT token.
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

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const { password: _, ...userWithoutPassword } = user;
  const tokens = await generateTokens(prisma, user);
  return { ...tokens, user: userWithoutPassword };
}

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

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { isRevoked: true },
  });

  const tokens = await generateTokens(prisma, stored.user);
  return tokens;
}

export async function logoutUser(prisma, refreshToken) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { isRevoked: true },
  });
}

/**
 * Get current authenticated user.
 */
export async function getMe(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
}
