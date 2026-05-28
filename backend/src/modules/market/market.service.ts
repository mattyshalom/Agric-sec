import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { getPagination, paginatedResponse } from '../../utils/pagination';

export async function getPrices(query: Record<string, string>) {
  const { commodity, country, market } = query;
  const { skip, take, page, limit } = getPagination(query);

  const where = {
    ...(commodity && { commodity: { contains: commodity, mode: 'insensitive' as const } }),
    ...(country && { country }),
    ...(market && { market: { contains: market, mode: 'insensitive' as const } }),
  };

  const [data, total] = await Promise.all([
    prisma.marketPrice.findMany({ where, skip, take, orderBy: { recordedAt: 'desc' } }),
    prisma.marketPrice.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

export async function getLatestPrices(country?: string) {
  // Get the most recent price per commodity
  const result = await prisma.$queryRaw<Array<{
    commodity: string; market: string; country: string;
    pricePerKg: number; currency: string; recordedAt: Date;
  }>>`
    SELECT DISTINCT ON (commodity, country) commodity, market, country, "pricePerKg", currency, "recordedAt"
    FROM "MarketPrice"
    ${country ? prisma.$queryRaw`WHERE country = ${country}` : prisma.$queryRaw``}
    ORDER BY commodity, country, "recordedAt" DESC
  `;
  return result;
}

export async function createPrice(data: {
  commodity: string; market: string; country: string;
  pricePerKg: number; currency?: string; recordedAt: string; source?: string;
}) {
  return prisma.marketPrice.create({ data: { ...data, recordedAt: new Date(data.recordedAt) } });
}

export async function getUserPriceAlerts(userId: string) {
  return prisma.priceAlert.findMany({ where: { userId, isActive: true } });
}

export async function createPriceAlert(data: {
  userId: string; commodity: string; country: string;
  targetPrice: number; condition: string;
}) {
  return prisma.priceAlert.create({ data });
}

export async function deletePriceAlert(alertId: string, userId: string) {
  const alert = await prisma.priceAlert.findUnique({ where: { id: alertId } });
  if (!alert) throw new AppError('Alert not found', 404);
  if (alert.userId !== userId) throw new AppError('Forbidden', 403);
  await prisma.priceAlert.delete({ where: { id: alertId } });
}
