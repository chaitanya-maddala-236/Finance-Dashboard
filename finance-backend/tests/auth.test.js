import supertest from 'supertest';
import { buildTestApp, createPrismaClient, cleanDb } from './helpers.js';

let app;
let prisma;

beforeAll(async () => {
  app = await buildTestApp();
  prisma = createPrismaClient();
  await cleanDb(prisma);
});

afterAll(async () => {
  await cleanDb(prisma);
  await app.close();
  await prisma.$disconnect();
});

describe('Auth Module', () => {
  const testEmail = 'auth_user@test.com';
  const testPassword = 'Password123!';
  const testName = 'Auth Test User';

  describe('POST /auth/register', () => {
    it('registers a new user and returns user data without password', async () => {
      const res = await supertest(app.server)
        .post('/auth/register')
        .send({ name: testName, email: testEmail, password: testPassword });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');

      const user = res.body.data;
      expect(user.id).toBeDefined();
      expect(user.name).toBe(testName);
      expect(user.email).toBe(testEmail);
      expect(user.role).toBe('VIEWER');
      expect(user.status).toBe('ACTIVE');
      expect(user.createdAt).toBeDefined();

      // Password must never be returned
      expect(user.password).toBeUndefined();
    });

    it('rejects duplicate email with 409', async () => {
      const res = await supertest(app.server)
        .post('/auth/register')
        .send({ name: testName, email: testEmail, password: testPassword });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects registration with missing required fields', async () => {
      const res = await supertest(app.server)
        .post('/auth/register')
        .send({ email: 'incomplete@test.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('ignores any role provided during self-registration (always VIEWER)', async () => {
      const res = await supertest(app.server)
        .post('/auth/register')
        .send({ name: 'Sneaky User', email: 'sneaky@test.com', password: testPassword, role: 'ADMIN' });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('VIEWER');
    });
  });

  describe('POST /auth/login', () => {
    it('logs in with valid credentials and returns a JWT token', async () => {
      const res = await supertest(app.server)
        .post('/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');

      const { token, user } = res.body.data;
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(user.email).toBe(testEmail);
      expect(user.role).toBe('VIEWER');

      // Password must never be returned
      expect(user.password).toBeUndefined();
    });

    it('rejects login with wrong password (401)', async () => {
      const res = await supertest(app.server)
        .post('/auth/login')
        .send({ email: testEmail, password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects login for non-existent user (401)', async () => {
      const res = await supertest(app.server)
        .post('/auth/login')
        .send({ email: 'nobody@test.com', password: testPassword });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    let token;

    beforeAll(async () => {
      const res = await supertest(app.server)
        .post('/auth/login')
        .send({ email: testEmail, password: testPassword });
      token = res.body.data.token;
    });

    it('returns current user data with a valid token', async () => {
      const res = await supertest(app.server)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User retrieved successfully');

      const user = res.body.data;
      expect(user.email).toBe(testEmail);
      expect(user.name).toBe(testName);
      expect(user.role).toBe('VIEWER');
      expect(user.password).toBeUndefined();
    });

    it('returns 401 when no token is provided', async () => {
      const res = await supertest(app.server)
        .get('/auth/me');

      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await supertest(app.server)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });
  });
});

