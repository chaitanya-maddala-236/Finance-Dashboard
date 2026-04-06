import { NotFoundError, ForbiddenError } from '../../utils/errors.js';

const RECORD_SELECT = {
  id: true,
  amount: true,
  type: true,
  category: true,
  date: true,
  notes: true,
  isDeleted: true,
  createdById: true,
  createdBy: {
    select: { id: true, name: true, email: true },
  },
  createdAt: true,
  updatedAt: true,
};

/**
 * List records with optional filters (excludes soft-deleted by default).
 */
export async function getRecords(
  prisma,
  filters,
  user
) {
  const {
    type, category, startDate, endDate,
    search, page = 1, limit = 10,
    sortBy = 'date', sortOrder = 'desc',
    includeDeleted = false,
  } = filters;

  const where = includeDeleted ? {} : { isDeleted: false };

  // DATA ISOLATION — ANALYST sees only their own records
  // ADMIN sees all records
  if (user.role === 'ANALYST') {
    where.createdById = user.id || user.sub || user.userId;
  }

  if (type) where.type = type;
  if (category) where.category = { contains: category, mode: 'insensitive' };
  if (search) where.notes = { contains: search, mode: 'insensitive' };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const skip = (parsedPage - 1) * parsedLimit;
  const take = Math.min(parsedLimit, 100);
  const safeSortBy = ['date', 'amount', 'category', 'type', 'createdAt', 'updatedAt'].includes(sortBy)
    ? sortBy
    : 'date';
  const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

  const [records, total] = await Promise.all([
    prisma.record.findMany({
      where,
      select: RECORD_SELECT,
      orderBy: { [safeSortBy]: safeSortOrder },
      skip,
      take,
    }),
    prisma.record.count({ where }),
  ]);

  return {
    records,
    pagination: {
      total,
      page: parsedPage,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

export async function listRecords(prisma, filters, requestingUser) {
  return getRecords(prisma, filters, requestingUser);
}

/**
 * Get a single record by ID.
 */
export async function getRecordById(prisma, id, requestingUser) {
  return getSingleRecord(prisma, id, requestingUser);
}

export async function getSingleRecord(prisma, id, user) {
  const where = { id, isDeleted: false };

  // ANALYST can only view their own record
  if (user.role === 'ANALYST') {
    where.createdById = user.id || user.sub || user.userId;
  }

  const record = await prisma.record.findFirst({
    where,
    select: RECORD_SELECT,
  });

  if (!record) {
    const error = new Error('Record not found');
    error.statusCode = 404;
    throw error;
  }

  // VIEWER can only view their own records
  if (user.role === 'VIEWER' && record.createdById !== (user.id || user.sub || user.userId)) {
    throw new ForbiddenError('You do not have access to this record');
  }

  return record;
}

/**
 * Create a new financial record.
 */
export async function createRecord(prisma, data, requestingUser) {
  const record = await prisma.record.create({
    data: {
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: new Date(data.date),
      notes: data.notes,
      createdById: requestingUser.sub,
    },
    select: RECORD_SELECT,
  });

  return record;
}

/**
 * Update an existing record.
 */
export async function updateRecord(prisma, id, updates, requestingUser) {
  const record = await prisma.record.findFirst({
    where: { id, isDeleted: false },
  });

  if (!record) {
    throw new NotFoundError(`Record with id '${id}' not found`);
  }

  // Only ADMIN can update any record; ANALYST/VIEWER can only update their own
  if (requestingUser.role !== 'ADMIN' && record.createdById !== requestingUser.sub) {
    throw new ForbiddenError('You do not have permission to update this record');
  }

  const data = {};
  if (updates.amount !== undefined) data.amount = updates.amount;
  if (updates.type !== undefined) data.type = updates.type;
  if (updates.category !== undefined) data.category = updates.category;
  if (updates.date !== undefined) data.date = new Date(updates.date);
  if (updates.notes !== undefined) data.notes = updates.notes;

  const updated = await prisma.record.update({
    where: { id },
    data,
    select: RECORD_SELECT,
  });

  return updated;
}

/**
 * Soft-delete a record.
 */
export async function deleteRecord(prisma, id, requestingUser) {
  const record = await prisma.record.findFirst({
    where: { id, isDeleted: false },
  });

  if (!record) {
    throw new NotFoundError(`Record with id '${id}' not found`);
  }

  // Only ADMIN can delete any record; ANALYST can delete their own
  if (requestingUser.role === 'VIEWER') {
    throw new ForbiddenError('Viewers cannot delete records');
  }

  if (requestingUser.role !== 'ADMIN' && record.createdById !== requestingUser.sub) {
    throw new ForbiddenError('You do not have permission to delete this record');
  }

  const deleted = await prisma.record.update({
    where: { id },
    data: { isDeleted: true },
    select: RECORD_SELECT,
  });

  return deleted;
}
