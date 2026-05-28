import prisma from '../config/database';
import { fetchAndStoreForecast } from '../modules/weather/weather.service';
import { logger } from '../config/logger';

export async function weatherJob() {
  const farms = await prisma.farm.findMany({
    select: { id: true, ownerId: true, name: true },
  });

  for (const farm of farms) {
    try {
      await fetchAndStoreForecast(farm.id, farm.ownerId);
      logger.debug(`[WeatherJob] Updated ${farm.name}`);
    } catch (err) {
      logger.error(`[WeatherJob] Failed for farm ${farm.name}`, err);
    }
  }
}
