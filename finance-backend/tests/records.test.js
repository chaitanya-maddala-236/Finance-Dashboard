import supertest from 'supertest';
import {
  buildTestApp,
  createPrismaClient,
  createUser,
  loginUser,
  cleanDb,
} from './helpers.js';

let app;
let prisma;
let adminToken;
let analystToken;
let viewerToken;

beforeAll(async () => {
  app = await buildTestApp();
  prisma = createPrismaClient();
  await cleanDb(prisma);

  // Create test users with explicit roles directly in the DB
  await createUser(prisma, {
    name: 'Records Admin',
    email: 'records_admin@test.com',
    password: 'Password123!',
    role: 'ADMIN',
  });
  await createUser(prisma, {
    name: 'Records Analyst',
    email: 'records_analyst@test.com',
    password: 'Password123!',
    role: 'ANALYST',
  });
  await createUser(prisma, {
    name: 'Records Viewer',
    email: 'records_viewer@test.com',
    password: 'Password123!',
    role: 'VIEWER',
  });

  adminToken = await loginUser(app, supertest, 'records_admin@test.com', 'Password123!');
  analystToken = await loginUser(app, supertest, 'records_analyst@test.com', 'Password123!');
  viewerToken = await loginUser(app, supertest, 'records_viewer@test.com', 'Password123!');
});

afterAll(async () => {
  await cleanDb(prisma);
  await app.close();
  await prisma.$disconnect();
});

describe('Records Module', () => {
  describe('POST /records — create record', () => {
    it('ADMIN can create a record (201)', async () => {
      const res = await supertest(app.server)
        .post('/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1500.0,
          type: 'INCOME',
          category: 'Salary',
          date: '2025-01-15',
          notes: 'Monthly salary',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(1500.0);
      expect(res.body.data.type).toBe('INCOME');
      expect(res.body.data.category).toBe('Salary');
      expect(res.body.data.isDeleted).toBe(false);
    });

    it('ANALYST cannot create a record (403)', async () => {
      const res = await supertest(app.server)
        .post('/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          amount: 250.0,
          type: 'EXPENSE',
          category: 'Food',
          date: '2025-01-20',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('VIEWER cannot create a record (403)', async () => {
      const res = await supertest(app.server)
        .post('/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          amount: 100.0,
          type: 'EXPENSE',
          category: 'Food',
          date: '2025-01-21',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects request without a token (401)', async () => {
      const res = await supertest(app.server)
        .post('/records')
        .send({ amount: 100.0, type: 'INCOME', category: 'Other', date: '2025-01-01' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /records — list and filter records', () => {
    beforeAll(async () => {
      // Seed additional records with varied data for filtering tests
      await supertest(app.server)
        .post('/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 500.0, type: 'INCOME', category: 'Freelance', date: '2025-02-10' });

      await supertest(app.server)
        .post('/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 120.0, type: 'EXPENSE', category: 'Transport', date: '2025-02-15' });

      await supertest(app.server)
        .post('/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 80.0, type: 'EXPENSE', category: 'Food', date: '2025-03-05' });
    });

    it('ANALYST can view only own records (200)', async () => {
      const analystUser = await prisma.user.findUnique({ where: { email: 'records_analyst@test.com' } });
      const ownCreate = await prisma.record.create({
        data: {
          amount: 77,
          type: 'EXPENSE',
          category: 'Own',
          date: new Date('2025-02-11'),
          createdById: analystUser.id,
        },
      });

      const res = await supertest(app.server)
        .get('/records')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.records)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.total).toBeGreaterThan(0);
      expect(res.body.data.records.map((r) => r.id)).toContain(ownCreate.id);
      res.body.data.records.forEach((r) => {
        expect(r.createdById).toBe(analystUser.id);
      });
    });

    it('filters records by type=INCOME', async () => {
      const res = await supertest(app.server)
        .get('/records?type=INCOME')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const records = res.body.data.records;
      expect(records.length).toBeGreaterThan(0);
      records.forEach((r) => expect(r.type).toBe('INCOME'));
    });

    it('filters records by type=EXPENSE', async () => {
      const res = await supertest(app.server)
        .get('/records?type=EXPENSE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const records = res.body.data.records;
      expect(records.length).toBeGreaterThan(0);
      records.forEach((r) => expect(r.type).toBe('EXPENSE'));
    });

    it('filters records by category', async () => {
      const res = await supertest(app.server)
        .get('/records?category=Salary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const records = res.body.data.records;
      expect(records.length).toBeGreaterThan(0);
      records.forEach((r) =>
        expect(r.category.toLowerCase()).toContain('salary')
      );
    });

    it('filters records by date range', async () => {
      const res = await supertest(app.server)
        .get('/records?startDate=2025-02-01&endDate=2025-02-28')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const records = res.body.data.records;
      expect(records.length).toBeGreaterThan(0);
      records.forEach((r) => {
        const date = new Date(r.date);
        const startDate = new Date('2025-02-01T00:00:00.000Z');
        const endDate = new Date('2025-02-28T23:59:59.999Z');
        expect(date >= startDate).toBe(true);
        expect(date <= endDate).toBe(true);
      });
    });
  });

  describe('DELETE /records/:id — soft delete', () => {
    let recordId;

    beforeAll(async () => {
      const res = await supertest(app.server)
        .post('/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 999.0,
          type: 'INCOME',
          category: 'Bonus',
          date: '2025-04-01',
          notes: 'Record to be deleted',
        });

      expect(res.status).toBe(201);
      recordId = res.body.data.id;
      expect(recordId).toBeDefined();
    });

    it('soft-deletes a record (sets isDeleted=true)', async () => {
      const deleteRes = await supertest(app.server)
        .delete(`/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.isDeleted).toBe(true);
    });

    it('deleted record does not appear in the default list', async () => {
      const listRes = await supertest(app.server)
        .get('/records')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      const ids = listRes.body.data.records.map((r) => r.id);
      expect(ids).not.toContain(recordId);
    });
  });
});
