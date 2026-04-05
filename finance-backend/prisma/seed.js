import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

  // Seed admin user
  const adminPassword = await bcrypt.hash('Admin@1234', rounds);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@finance.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@finance.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Seed analyst user
  const analystPassword = await bcrypt.hash('Analyst@1234', rounds);
  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@finance.com' },
    update: {},
    create: {
      name: 'Analyst User',
      email: 'analyst@finance.com',
      password: analystPassword,
      role: 'ANALYST',
      status: 'ACTIVE',
    },
  });

  // Seed viewer user
  const viewerPassword = await bcrypt.hash('Viewer@1234', rounds);
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@finance.com' },
    update: {},
    create: {
      name: 'Viewer User',
      email: 'viewer@finance.com',
      password: viewerPassword,
      role: 'VIEWER',
      status: 'ACTIVE',
    },
  });

  // Seed sample records
  const records = [
    {
      amount: 5000.0,
      type: 'INCOME',
      category: 'Salary',
      date: new Date('2024-01-15'),
      notes: 'Monthly salary',
      createdById: admin.id,
    },
    {
      amount: 1200.0,
      type: 'EXPENSE',
      category: 'Rent',
      date: new Date('2024-01-01'),
      notes: 'Monthly rent',
      createdById: admin.id,
    },
    {
      amount: 350.0,
      type: 'EXPENSE',
      category: 'Groceries',
      date: new Date('2024-01-10'),
      notes: 'Weekly groceries',
      createdById: analyst.id,
    },
    {
      amount: 800.0,
      type: 'INCOME',
      category: 'Freelance',
      date: new Date('2024-01-20'),
      notes: 'Freelance project',
      createdById: analyst.id,
    },
    {
      amount: 200.0,
      type: 'EXPENSE',
      category: 'Utilities',
      date: new Date('2024-01-05'),
      notes: 'Electricity and water',
      createdById: viewer.id,
    },
  ];

  for (const record of records) {
    await prisma.record.create({ data: record });
  }

  console.log('✅ Database seeded successfully');
  console.log(`   Admin:    admin@finance.com / Admin@1234`);
  console.log(`   Analyst:  analyst@finance.com / Analyst@1234`);
  console.log(`   Viewer:   viewer@finance.com / Viewer@1234`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
