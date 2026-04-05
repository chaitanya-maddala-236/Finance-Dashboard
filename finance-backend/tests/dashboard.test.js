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

beforeAll(async () => {
  app = await buildTestApp();
  prisma = createPrismaClient();
  await cleanDb(prisma);

  await createUser(prisma, {
    name: 'Dashboard Admin',
    email: 'dashboard_admin@test.com',
    password: 'Password123!',
    role: 'ADMIN',
  });
  adminToken = await loginUser(app, supertest, 'dashboard_admin@test.com', 'Password123!');

  // Seed records with known amounts across two months
  const records = [
    { amount: 3000.0, type: 'INCOME', category: 'Salary', date: '2025-03-15' },
    { amount: 1500.0, type: 'INCOME', category: 'Freelance', date: '2025-03-20' },
    { amount: 400.0, type: 'EXPENSE', category: 'Rent', date: '2025-03-01' },
    { amount: 150.0, type: 'EXPENSE', category: 'Food', date: '2025-03-10' },
    { amount: 2000.0, type: 'INCOME', category: 'Salary', date: '2025-04-15' },
    { amount: 300.0, type: 'EXPENSE', category: 'Food', date: '2025-04-20' },
  ];

  for (const record of records) {
    const res = await supertest(app.server)
      .post('/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(record);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  }
});

afterAll(async () => {
  await cleanDb(prisma);
  await app.close();
  await prisma.$disconnect();
});

describe('Dashboard Module', () => {
  describe('GET /dashboard/summary', () => {
    it('returns totalIncome, totalExpense, and netBalance (200)', async () => {
      const res = await supertest(app.server)
        .get('/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { summary } = res.body.data;
      expect(typeof summary.totalIncome).toBe('number');
      expect(typeof summary.totalExpense).toBe('number');
      expect(typeof summary.netBalance).toBe('number');
      expect(summary.netBalance).toBeCloseTo(
        summary.totalIncome - summary.totalExpense,
        5
      );
    });

    it('computes correct aggregated totals for seeded data', async () => {
      const res = await supertest(app.server)
        .get('/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const { summary } = res.body.data;

      // Seeded: income = 3000 + 1500 + 2000 = 6500, expense = 400 + 150 + 300 = 850
      expect(summary.totalIncome).toBeCloseTo(6500, 2);
      expect(summary.totalExpense).toBeCloseTo(850, 2);
      expect(summary.netBalance).toBeCloseTo(5650, 2);
      expect(summary.totalRecords).toBe(6);
      expect(summary.incomeCount).toBe(3);
      expect(summary.expenseCount).toBe(3);
    });

    it('returns categoryBreakdown with entries per category and type', async () => {
      const res = await supertest(app.server)
        .get('/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const { categoryBreakdown } = res.body.data;
      expect(Array.isArray(categoryBreakdown)).toBe(true);
      expect(categoryBreakdown.length).toBeGreaterThan(0);

      const salaryEntry = categoryBreakdown.find(
        (e) => e.category === 'Salary' && e.type === 'INCOME'
      );
      expect(salaryEntry).toBeDefined();
      // Salary INCOME: 3000 + 2000 = 5000
      expect(salaryEntry.totalAmount).toBeCloseTo(5000, 2);
      expect(salaryEntry.count).toBe(2);
    });

    it('returns recentRecords (up to 5 entries)', async () => {
      const res = await supertest(app.server)
        .get('/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const { recentRecords } = res.body.data;
      expect(Array.isArray(recentRecords)).toBe(true);
      expect(recentRecords.length).toBeLessThanOrEqual(5);
    });

    it('respects date range filters in summary', async () => {
      const res = await supertest(app.server)
        .get('/dashboard/summary?startDate=2025-03-01&endDate=2025-03-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const { summary } = res.body.data;

      // March only: income = 3000 + 1500 = 4500, expense = 400 + 150 = 550
      expect(summary.totalIncome).toBeCloseTo(4500, 2);
      expect(summary.totalExpense).toBeCloseTo(550, 2);
      expect(summary.netBalance).toBeCloseTo(3950, 2);
    });

    it('requires authentication (401 without token)', async () => {
      const res = await supertest(app.server).get('/dashboard/summary');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /dashboard/monthly', () => {
    it('returns monthly breakdown for the requested year (200)', async () => {
      const res = await supertest(app.server)
        .get('/dashboard/monthly?year=2025')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { year, breakdown } = res.body.data;
      expect(year).toBe(2025);
      expect(Array.isArray(breakdown)).toBe(true);
      expect(breakdown.length).toBe(12);
    });

    it('returns correct income/expense/net values per month', async () => {
      const res = await supertest(app.server)
        .get('/dashboard/monthly?year=2025')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const { breakdown } = res.body.data;

      const march = breakdown.find((b) => b.month === '2025-03');
      expect(march).toBeDefined();
      expect(march.income).toBeCloseTo(4500, 2);
      expect(march.expense).toBeCloseTo(550, 2);
      expect(march.net).toBeCloseTo(3950, 2);

      const april = breakdown.find((b) => b.month === '2025-04');
      expect(april).toBeDefined();
      expect(april.income).toBeCloseTo(2000, 2);
      expect(april.expense).toBeCloseTo(300, 2);
      expect(april.net).toBeCloseTo(1700, 2);
    });

    it('returns zero values for months with no records', async () => {
      const res = await supertest(app.server)
        .get('/dashboard/monthly?year=2025')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const { breakdown } = res.body.data;

      const january = breakdown.find((b) => b.month === '2025-01');
      expect(january).toBeDefined();
      expect(january.income).toBe(0);
      expect(january.expense).toBe(0);
      expect(january.net).toBe(0);
    });

    it('requires authentication (401 without token)', async () => {
      const res = await supertest(app.server).get('/dashboard/monthly');
      expect(res.status).toBe(401);
    });
  });
});
