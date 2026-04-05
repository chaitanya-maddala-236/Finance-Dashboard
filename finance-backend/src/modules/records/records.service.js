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
export async function listRecords(prisma, { page = 1, limit = 10, type, category, startDate, endDate, includeDeleted = false }, requestingUser) {
  const where = {};

  if (!includeDeleted) {
    where.isDeleted = false;
  }

  // VIEWER can only see their own records
  if (requestingUser.role === 'VIEWER') {
    where.createdById = requestingUser.sub;
  }

  if (type) where.type = type;
  if (category) where.category = { contains: category, mode: 'insensitive' };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    prisma.record.findMany({
      where,
      select: RECORD_SELECT,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.record.count({ where }),
  ]);

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single record by ID.
 */
export async function getRecordById(prisma, id, requestingUser) {
  const record = await prisma.record.findFirst({
    where: { id, isDeleted: false },
    select: RECORD_SELECT,
  });

  if (!record) {
    throw new NotFoundError(`Record with id '${id}' not found`);
  }

  // VIEWER can only view their own records
  if (requestingUser.role === 'VIEWER' && record.createdById !== requestingUser.sub) {
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
