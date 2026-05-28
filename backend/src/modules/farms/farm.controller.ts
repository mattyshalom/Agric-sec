import { asyncHandler } from '../../utils/asyncHandler';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

const ownerGuard = async (farmId: string, userId: string) => {
  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (!farm) throw new AppError('Farm not found', 404);
  if (farm.ownerId !== userId) throw new AppError('Forbidden', 403);
  return farm;
};

export const listFarms = asyncHandler(async (req, res) => {
  const farms = await prisma.farm.findMany({
    where: { ownerId: req.user!.id },
    include: { _count: { select: { crops: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: farms });
});

export const createFarm = asyncHandler(async (req, res) => {
  const farm = await prisma.farm.create({
    data: { ...req.body, ownerId: req.user!.id },
  });
  res.status(201).json({ success: true, data: farm });
});

export const getFarm = asyncHandler(async (req, res) => {
  const farm = await ownerGuard(req.params.farmId, req.user!.id);
  res.json({ success: true, data: farm });
});

export const updateFarm = asyncHandler(async (req, res) => {
  await ownerGuard(req.params.farmId, req.user!.id);
  const farm = await prisma.farm.update({
    where: { id: req.params.farmId },
    data: req.body,
  });
  res.json({ success: true, data: farm });
});

export const deleteFarm = asyncHandler(async (req, res) => {
  await ownerGuard(req.params.farmId, req.user!.id);
  await prisma.farm.delete({ where: { id: req.params.farmId } });
  res.json({ success: true, message: 'Farm deleted' });
});

export const getFarmSummary = asyncHandler(async (req, res) => {
  const farmId = req.params.farmId;
  await ownerGuard(farmId, req.user!.id);

  const [cropCount, openPests, resourceCount, recentTx] = await Promise.all([
    prisma.crop.count({ where: { farmId } }),
    prisma.pestReport.count({ where: { farmId, status: 'OPEN' } }),
    prisma.resource.count({ where: { farmId } }),
    prisma.financialTransaction.aggregate({
      where: { farmId },
      _sum: { amount: true },
    }),
  ]);

  res.json({
    success: true,
    data: {
      cropCount,
      openPestReports: openPests,
      resourceCount,
      totalTransactionAmount: recentTx._sum.amount ?? 0,
    },
  });
});
