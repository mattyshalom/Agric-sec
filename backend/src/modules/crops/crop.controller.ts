import { asyncHandler } from '../../utils/asyncHandler';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

const guardFarmOwner = async (farmId: string, userId: string) => {
  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (!farm) throw new AppError('Farm not found', 404);
  if (farm.ownerId !== userId) throw new AppError('Forbidden', 403);
};

export const listCrops = asyncHandler(async (req, res) => {
  const { farmId } = req.params;
  await guardFarmOwner(farmId, req.user!.id);
  const crops = await prisma.crop.findMany({
    where: { farmId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: crops });
});

export const createCrop = asyncHandler(async (req, res) => {
  const { farmId } = req.params;
  await guardFarmOwner(farmId, req.user!.id);
  const crop = await prisma.crop.create({ data: { ...req.body, farmId } });
  res.status(201).json({ success: true, data: crop });
});

export const getCrop = asyncHandler(async (req, res) => {
  const { farmId, cropId } = req.params;
  await guardFarmOwner(farmId, req.user!.id);
  const crop = await prisma.crop.findFirst({ where: { id: cropId, farmId } });
  if (!crop) throw new AppError('Crop not found', 404);
  res.json({ success: true, data: crop });
});

export const updateCrop = asyncHandler(async (req, res) => {
  const { farmId, cropId } = req.params;
  await guardFarmOwner(farmId, req.user!.id);
  const crop = await prisma.crop.updateMany({
    where: { id: cropId, farmId },
    data: req.body,
  });
  if (crop.count === 0) throw new AppError('Crop not found', 404);
  const updated = await prisma.crop.findUnique({ where: { id: cropId } });
  res.json({ success: true, data: updated });
});

export const deleteCrop = asyncHandler(async (req, res) => {
  const { farmId, cropId } = req.params;
  await guardFarmOwner(farmId, req.user!.id);
  await prisma.crop.deleteMany({ where: { id: cropId, farmId } });
  res.json({ success: true, message: 'Crop deleted' });
});
