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
  const hashedPassword = await bcrypt.hash(password, 10);
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
  return res.body.data?.token;
}

/**
 * Remove all records and users from the test database.
 * Records must be deleted before users due to the foreign key constraint.
 */
export async function cleanDb(prisma) {
  await prisma.record.deleteMany();
  await prisma.user.deleteMany();
}
