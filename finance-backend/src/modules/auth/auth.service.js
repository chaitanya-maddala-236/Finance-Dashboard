import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

  // BCRYPT_ROUNDS should be 12+ in production, 4 in test for speed
  const parsedRounds = Number.parseInt(process.env.BCRYPT_ROUNDS, 10);
  const rounds = Number.isInteger(parsedRounds) && parsedRounds >= 4 && parsedRounds <= 31
    ? parsedRounds
    : 12;
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

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { sub: user.id, userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
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

