import { asyncHandler } from '../../utils/asyncHandler';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { getPagination, paginatedResponse } from '../../utils/pagination';

const guardFarm = async (farmId: string, userId: string) => {
  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (!farm) throw new AppError('Farm not found', 404);
  if (farm.ownerId !== userId) throw new AppError('Forbidden', 403);
  return farm;
};

export const listTransactions = asyncHandler(async (req, res) => {
  const q = req.query as Record<string, string>;
  const { farmId, type, category } = q;
  if (!farmId) throw new AppError('farmId required', 400);
  await guardFarm(farmId, req.user!.id);

  const { skip, take, page, limit } = getPagination(q);
  const where = {
    farmId,
    ...(type && { type: type as 'INCOME' | 'EXPENSE' }),
    ...(category && { category: { contains: category, mode: 'insensitive' as const } }),
  };

  const [data, total] = await Promise.all([
    prisma.financialTransaction.findMany({ where, skip, take, orderBy: { transactedAt: 'desc' } }),
    prisma.financialTransaction.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
});

export const createTransaction = asyncHandler(async (req, res) => {
  await guardFarm(req.body.farmId, req.user!.id);
  const tx = await prisma.financialTransaction.create({
    data: {
      ...req.body,
      userId: req.user!.id,
      transactedAt: new Date(req.body.transactedAt),
    },
  });
  res.status(201).json({ success: true, data: tx });
});

export const getTransaction = asyncHandler(async (req, res) => {
  const tx = await prisma.financialTransaction.findUnique({ where: { id: req.params.txId } });
  if (!tx) throw new AppError('Transaction not found', 404);
  if (tx.userId !== req.user!.id) throw new AppError('Forbidden', 403);
  res.json({ success: true, data: tx });
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const tx = await prisma.financialTransaction.findUnique({ where: { id: req.params.txId } });
  if (!tx) throw new AppError('Transaction not found', 404);
  if (tx.userId !== req.user!.id) throw new AppError('Forbidden', 403);
  const updated = await prisma.financialTransaction.update({
    where: { id: req.params.txId },
    data: req.body,
  });
  res.json({ success: true, data: updated });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const tx = await prisma.financialTransaction.findUnique({ where: { id: req.params.txId } });
  if (!tx) throw new AppError('Transaction not found', 404);
  if (tx.userId !== req.user!.id) throw new AppError('Forbidden', 403);
  await prisma.financialTransaction.delete({ where: { id: req.params.txId } });
  res.json({ success: true });
});

export const getSummary = asyncHandler(async (req, res) => {
  const { farmId, year } = req.query as Record<string, string>;
  if (!farmId) throw new AppError('farmId required', 400);
  await guardFarm(farmId, req.user!.id);

  const yearNum = parseInt(year) || new Date().getFullYear();
  const start = new Date(`${yearNum}-01-01`);
  const end = new Date(`${yearNum}-12-31T23:59:59`);

  const [income, expense, monthly] = await Promise.all([
    prisma.financialTransaction.aggregate({
      where: { farmId, type: 'INCOME', transactedAt: { gte: start, lte: end } },
      _sum: { amount: true }, _count: true,
    }),
    prisma.financialTransaction.aggregate({
      where: { farmId, type: 'EXPENSE', transactedAt: { gte: start, lte: end } },
      _sum: { amount: true }, _count: true,
    }),
    prisma.financialTransaction.groupBy({
      by: ['type'],
      where: { farmId, transactedAt: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = income._sum.amount ?? 0;
  const totalExpense = expense._sum.amount ?? 0;

  res.json({
    success: true,
    data: {
      year: yearNum,
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      transactionCount: income._count + expense._count,
    },
  });
});

export const getBudget = asyncHandler(async (req, res) => {
  const { farmId } = req.query as { farmId: string };
  if (!farmId) throw new AppError('farmId required', 400);
  await guardFarm(farmId, req.user!.id);
  const budget = await prisma.budget.findUnique({ where: { farmId } });
  res.json({ success: true, data: budget });
});

export const upsertBudget = asyncHandler(async (req, res) => {
  await guardFarm(req.body.farmId, req.user!.id);
  const budget = await prisma.budget.upsert({
    where: { farmId: req.body.farmId },
    create: req.body,
    update: { totalBudget: req.body.totalBudget, year: req.body.year, notes: req.body.notes },
  });
  res.json({ success: true, data: budget });
});
