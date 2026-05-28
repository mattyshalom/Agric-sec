import { asyncHandler } from '../../utils/asyncHandler';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { createNotification } from '../../utils/notification';

const guardFarm = async (farmId: string, userId: string) => {
  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (!farm) throw new AppError('Farm not found', 404);
  if (farm.ownerId !== userId) throw new AppError('Forbidden', 403);
  return farm;
};

const guardResource = async (resourceId: string, userId: string) => {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: { farm: true },
  });
  if (!resource) throw new AppError('Resource not found', 404);
  if (resource.farm.ownerId !== userId) throw new AppError('Forbidden', 403);
  return resource;
};

export const listResources = asyncHandler(async (req, res) => {
  const { farmId } = req.query as { farmId: string };
  if (!farmId) throw new AppError('farmId query param required', 400);
  await guardFarm(farmId, req.user!.id);
  const resources = await prisma.resource.findMany({
    where: { farmId },
    orderBy: { type: 'asc' },
  });
  res.json({ success: true, data: resources });
});

export const createResource = asyncHandler(async (req, res) => {
  await guardFarm(req.body.farmId, req.user!.id);
  const resource = await prisma.resource.create({ data: req.body });
  res.status(201).json({ success: true, data: resource });
});

export const getResource = asyncHandler(async (req, res) => {
  const resource = await guardResource(req.params.resourceId, req.user!.id);
  res.json({ success: true, data: resource });
});

export const updateResource = asyncHandler(async (req, res) => {
  await guardResource(req.params.resourceId, req.user!.id);
  const updated = await prisma.resource.update({
    where: { id: req.params.resourceId },
    data: req.body,
  });
  res.json({ success: true, data: updated });
});

export const deleteResource = asyncHandler(async (req, res) => {
  await guardResource(req.params.resourceId, req.user!.id);
  await prisma.resource.delete({ where: { id: req.params.resourceId } });
  res.json({ success: true });
});

export const logUsage = asyncHandler(async (req, res) => {
  const resource = await guardResource(req.params.resourceId, req.user!.id);
  const { quantityUsed, purpose, usedAt } = req.body;

  if (quantityUsed > resource.quantity) {
    throw new AppError(`Insufficient stock: only ${resource.quantity} ${resource.unit} available`, 400);
  }

  const [log, updated] = await prisma.$transaction([
    prisma.resourceUsageLog.create({
      data: { resourceId: resource.id, quantityUsed, purpose, usedAt: usedAt ? new Date(usedAt) : undefined },
    }),
    prisma.resource.update({
      where: { id: resource.id },
      data: { quantity: { decrement: quantityUsed } },
    }),
  ]);

  // Low-stock notification
  if (updated.quantity <= updated.minQuantity) {
    await createNotification({
      userId: req.user!.id,
      title: 'Low Stock Alert',
      message: `${resource.name} is running low (${updated.quantity} ${resource.unit} remaining).`,
      type: 'resource',
      refId: resource.id,
      refType: 'Resource',
    });
  }

  res.status(201).json({ success: true, data: { log, updatedResource: updated } });
});

export const getUsageLogs = asyncHandler(async (req, res) => {
  await guardResource(req.params.resourceId, req.user!.id);
  const logs = await prisma.resourceUsageLog.findMany({
    where: { resourceId: req.params.resourceId },
    orderBy: { usedAt: 'desc' },
  });
  res.json({ success: true, data: logs });
});
