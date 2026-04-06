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

export async function getDashboardSummary(prisma, filters = {}, requestingUser) {
  return getSummary(prisma, requestingUser, filters);
}

export async function getDashboardCategories(prisma, requestingUser, { startDate, endDate } = {}) {
  const where = { isDeleted: false };

  if (requestingUser.role === 'VIEWER') {
    where.createdById = requestingUser.sub;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const categoryBreakdown = await prisma.record.groupBy({
    by: ['category', 'type'],
    where,
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  return categoryBreakdown.map((item) => ({
    category: item.category,
    type: item.type,
    totalAmount: item._sum.amount ?? 0,
    count: item._count._all,
  }));
}

export async function getDashboardRecent(prisma, requestingUser, { startDate, endDate, limit = 5 } = {}) {
  const where = { isDeleted: false };

  if (requestingUser.role === 'VIEWER') {
    where.createdById = requestingUser.sub;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const take = Math.min(parseInt(limit, 10) || 5, 20);

  return prisma.record.findMany({
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
    take,
  });
}

export async function getDashboardTrends(prisma, requestingUser, { year, period, startDate, endDate } = {}) {
  const where = { isDeleted: false };

  if (requestingUser.role === 'VIEWER') {
    where.createdById = requestingUser.sub;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  } else if (year) {
    const targetYear = parseInt(year, 10);
    if (!Number.isNaN(targetYear)) {
      where.date = {
        gte: new Date(`${targetYear}-01-01T00:00:00.000Z`),
        lte: new Date(`${targetYear}-12-31T23:59:59.999Z`),
      };
    }
  }

  const records = await prisma.record.findMany({
    where,
    select: { amount: true, type: true, date: true },
    orderBy: { date: 'asc' },
  });

  if (period === 'daily') {
    const grouped = {};
    for (const record of records) {
      const d = new Date(record.date).toISOString().slice(0, 10);
      if (!grouped[d]) grouped[d] = { period: d, income: 0, expense: 0, net: 0 };
      if (record.type === 'INCOME') grouped[d].income += record.amount;
      else grouped[d].expense += record.amount;
      grouped[d].net = grouped[d].income - grouped[d].expense;
    }
    return Object.values(grouped);
  }

  const grouped = {};
  for (const record of records) {
    const d = new Date(record.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = { period: key, income: 0, expense: 0, net: 0 };
    if (record.type === 'INCOME') grouped[key].income += record.amount;
    else grouped[key].expense += record.amount;
    grouped[key].net = grouped[key].income - grouped[key].expense;
  }
  return Object.values(grouped);
}

/**
 * Get monthly breakdown of income vs expense.
 */
export async function getMonthlyBreakdown(prisma, requestingUser, { year, startDate, endDate } = {}) {
  const targetYear = parseInt(year || new Date().getFullYear(), 10);

  const dateRange = {};
  if (startDate) dateRange.gte = new Date(startDate);
  if (endDate) dateRange.lte = new Date(endDate);
  if (!startDate && !endDate) {
    dateRange.gte = new Date(`${targetYear}-01-01T00:00:00.000Z`);
    dateRange.lte = new Date(`${targetYear}-12-31T23:59:59.999Z`);
  }

  const where = {
    isDeleted: false,
    date: dateRange,
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
