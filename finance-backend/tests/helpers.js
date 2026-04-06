import { buildApp } from '../src/app.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Build and ready a Fastify app for testing (logger disabled).
 */
export async function buildTestApp() {
  const app = await buildApp({ logger: false });
  await app.ready();
  return app;
}

/**
 * Create a standalone Prisma client for test setup/teardown.
 */
export function createPrismaClient() {
  return new PrismaClient();
}

/**
 * Create a user directly in the DB with the specified role.
 * This bypasses the register API so any role can be set.
 */
export async function createUser(prisma, { name, email, password, role = 'VIEWER' }) {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const hashedPassword = await bcrypt.hash(password, rounds);
  return prisma.user.create({
    data: { name, email, password: hashedPassword, role },
  });
}

/**
 * Log in via the API and return the JWT token.
 */
export async function loginUser(app, supertest, email, password) {
  const res = await supertest(app.server)
    .post('/auth/login')
    .send({ email, password });

  const token = res.body?.data?.token;
  if (res.status !== 200 || res.body?.success === false || !token) {
    throw new Error(
      `Login failed for ${email}: status=${res.status}, body=${JSON.stringify(res.body)}`
    );
  }

  return token;
}

/**
 * Remove all records, refresh tokens, and users from the test database.
 * Order matters due to foreign key constraints.
 */
export async function cleanDb(prisma) {
  await prisma.record.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}
