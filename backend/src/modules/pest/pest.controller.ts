import { asyncHandler } from '../../utils/asyncHandler';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { getPagination, paginatedResponse } from '../../utils/pagination';
import { createNotification } from '../../utils/notification';

export const listReports = asyncHandler(async (req, res) => {
  const { farmId, status } = req.query as Record<string, string>;
  const { skip, take, page, limit } = getPagination(req.query as Record<string, string>);

  // Verify farm ownership if farmId supplied
  if (farmId) {
    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm || farm.ownerId !== req.user!.id) throw new AppError('Forbidden', 403);
  }

  const where = {
    ...(farmId && { farmId }),
    ...(status && { status: status as 'OPEN' | 'INVESTIGATING' | 'RESOLVED' }),
    ...(!farmId && { reportedById: req.user!.id }),
  };

  const [data, total] = await Promise.all([
    prisma.pestReport.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.pestReport.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
});

export const createReport = asyncHandler(async (req, res) => {
  const imageUrls = (req.files as Express.Multer.File[] | undefined)?.map(
    (f) => `/uploads/${f.filename}`
  ) ?? [];

  const report = await prisma.pestReport.create({
    data: {
      ...req.body,
      reportedById: req.user!.id,
      imageUrls,
    },
  });

  // Notify farm owner
  const farm = await prisma.farm.findUnique({ where: { id: req.body.farmId } });
  if (farm) {
    await createNotification({
      userId: farm.ownerId,
      title: 'New Pest Report',
      message: `${req.body.pestName} reported on your farm "${farm.name}".`,
      type: 'pest',
      refId: report.id,
      refType: 'PestReport',
    });
  }

  res.status(201).json({ success: true, data: report });
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await prisma.pestReport.findUnique({
    where: { id: req.params.reportId },
    include: { farm: true, crop: true, reportedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (!report) throw new AppError('Report not found', 404);
  res.json({ success: true, data: report });
});

export const updateReport = asyncHandler(async (req, res) => {
  const report = await prisma.pestReport.findUnique({ where: { id: req.params.reportId } });
  if (!report) throw new AppError('Report not found', 404);
  if (report.reportedById !== req.user!.id && req.user!.role === 'FARMER') {
    throw new AppError('Forbidden', 403);
  }
  const updated = await prisma.pestReport.update({
    where: { id: req.params.reportId },
    data: req.body,
  });
  res.json({ success: true, data: updated });
});

export const resolveReport = asyncHandler(async (req, res) => {
  const updated = await prisma.pestReport.update({
    where: { id: req.params.reportId },
    data: { status: 'RESOLVED', resolvedAt: new Date(), recommendation: req.body.recommendation },
  });
  res.json({ success: true, data: updated });
});

export const getMapReports = asyncHandler(async (_req, res) => {
  const reports = await prisma.pestReport.findMany({
    where: { status: 'OPEN', latitude: { not: null }, longitude: { not: null } },
    select: {
      id: true, pestName: true, severity: true, latitude: true, longitude: true,
      createdAt: true, farm: { select: { name: true, country: true, region: true } },
    },
  });
  res.json({ success: true, data: reports });
});
