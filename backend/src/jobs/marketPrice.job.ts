import prisma from '../config/database';
import { createNotification } from '../utils/notification';
import { logger } from '../config/logger';

export async function marketPriceJob() {
  const activeAlerts = await prisma.priceAlert.findMany({ where: { isActive: true } });

  for (const alert of activeAlerts) {
    // Get latest price for commodity + country
    const latest = await prisma.marketPrice.findFirst({
      where: { commodity: alert.commodity, country: alert.country },
      orderBy: { recordedAt: 'desc' },
    });

    if (!latest) continue;

    const triggered =
      (alert.condition === 'above' && latest.pricePerKg >= alert.targetPrice) ||
      (alert.condition === 'below' && latest.pricePerKg <= alert.targetPrice);

    if (triggered) {
      await createNotification({
        userId: alert.userId,
        title: 'Market Price Alert',
        message: `${alert.commodity} is now ${latest.currency} ${latest.pricePerKg}/kg in ${alert.country} — your target of ${alert.condition} ${alert.targetPrice} was reached.`,
        type: 'market',
        refId: alert.id,
        refType: 'PriceAlert',
      });

      logger.info(`[MarketJob] Triggered alert for user ${alert.userId} — ${alert.commodity}`);
    }
  }
}
