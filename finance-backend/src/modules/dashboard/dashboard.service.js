/**
 * Get a financial summary for the dashboard.
 *
 * - ADMIN/ANALYST: sees all records
 * - VIEWER: sees only their own records
 */
export async function getSummary(prisma, requestingUser, { startDate, endDate } = {}) {
  const where = { isDeleted: false };

  if (requestingUser.role === 'VIEWER') {
    where.createdById = requestingUser.sub;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  // Aggregate income and expenses
  const [incomeAgg, expenseAgg, totalRecords, recentRecords, categoryBreakdown] =
    await Promise.all([
      prisma.record.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.record.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.record.count({ where }),
      prisma.record.findMany({
        where,
        select: {
          id: true,
          amount: true,
          type: true,
          category: true,
          date: true,
          notes: true,
          createdBy: { select: { id: true, name: true } },
          createdAt: true,
        },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.record.groupBy({
        by: ['category', 'type'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

  const totalIncome = incomeAgg._sum.amount ?? 0;
  const totalExpense = expenseAgg._sum.amount ?? 0;
  const netBalance = totalIncome - totalExpense;

  return {
    summary: {
      totalIncome,
      totalExpense,
      netBalance,
      totalRecords,
      incomeCount: incomeAgg._count._all,
      expenseCount: expenseAgg._count._all,
    },
    recentRecords,
    categoryBreakdown: categoryBreakdown.map((item) => ({
      category: item.category,
      type: item.type,
      totalAmount: item._sum.amount ?? 0,
      count: item._count._all,
    })),
  };
}

/**
 * Get monthly breakdown of income vs expense.
 */
export async function getMonthlyBreakdown(prisma, requestingUser, { year }) {
  const targetYear = parseInt(year || new Date().getFullYear(), 10);

  const startOfYear = new Date(`${targetYear}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${targetYear}-12-31T23:59:59.999Z`);

  const where = {
    isDeleted: false,
    date: { gte: startOfYear, lte: endOfYear },
  };

  if (requestingUser.role === 'VIEWER') {
    where.createdById = requestingUser.sub;
  }

  const records = await prisma.record.findMany({
    where,
    select: { amount: true, type: true, date: true },
    orderBy: { date: 'asc' },
  });

  // Build month-by-month breakdown
  const months = {};
  for (let m = 1; m <= 12; m++) {
    const key = `${targetYear}-${String(m).padStart(2, '0')}`;
    months[key] = { month: key, income: 0, expense: 0, net: 0 };
  }

  for (const record of records) {
    const d = new Date(record.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (months[key]) {
      if (record.type === 'INCOME') {
        months[key].income += record.amount;
      } else {
        months[key].expense += record.amount;
      }
      months[key].net = months[key].income - months[key].expense;
    }
  }

  return {
    year: targetYear,
    breakdown: Object.values(months),
  };
}
