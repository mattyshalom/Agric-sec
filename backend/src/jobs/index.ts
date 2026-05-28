import cron from 'node-cron';
import { logger } from '../config/logger';
import { weatherJob } from './weather.job';
import { marketPriceJob } from './marketPrice.job';

export function startJobs() {
  // Refresh weather for all farms every 3 hours
  cron.schedule('0 */3 * * *', async () => {
    logger.info('[JOB] Running weather refresh');
    await weatherJob().catch((e) => logger.error('[JOB] Weather job failed', e));
  });

  // Check market price alerts daily at 08:00
  cron.schedule('0 8 * * *', async () => {
    logger.info('[JOB] Running market price alert check');
    await marketPriceJob().catch((e) => logger.error('[JOB] Market job failed', e));
  });

  logger.info('Background jobs scheduled');
}
