import axios from 'axios';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { createNotification } from '../../utils/notification';

const BASE_URL = process.env.OPENMETEO_BASE_URL || 'https://api.open-meteo.com/v1';

export async function fetchAndStoreForecast(farmId: string, userId: string) {
  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (!farm) throw new AppError('Farm not found', 404);

  const { data } = await axios.get(`${BASE_URL}/forecast`, {
    params: {
      latitude: farm.latitude,
      longitude: farm.longitude,
      hourly: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,uv_index',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      forecast_days: 7,
      timezone: 'auto',
    },
  });

  // Store today's hourly snapshots
  const logs = data.hourly.time.slice(0, 24).map((time: string, i: number) => ({
    farmId,
    recordedAt: new Date(time),
    temperatureC: data.hourly.temperature_2m[i],
    humidity: data.hourly.relative_humidity_2m[i],
    rainfallMm: data.hourly.precipitation[i],
    windSpeedKph: data.hourly.wind_speed_10m[i],
    uvIndex: data.hourly.uv_index[i],
    source: 'openmeteo',
  }));

  await prisma.weatherLog.createMany({ data: logs, skipDuplicates: true });

  // Check for alerts
  const maxTemp = Math.max(...data.hourly.temperature_2m.slice(0, 24));
  const maxRain = Math.max(...data.hourly.precipitation.slice(0, 24));

  if (maxTemp > 38) {
    await prisma.weatherAlert.create({
      data: {
        farmId,
        userId,
        severity: 'WARNING',
        title: 'High Temperature Alert',
        message: `Temperature expected to reach ${maxTemp}°C at ${farm.name}. Ensure adequate irrigation.`,
      },
    });
    await createNotification({
      userId,
      title: 'High Temperature Alert',
      message: `Temp at ${farm.name} may reach ${maxTemp}°C today.`,
      type: 'weather',
    });
  }

  if (maxRain > 50) {
    await prisma.weatherAlert.create({
      data: {
        farmId,
        userId,
        severity: 'CRITICAL',
        title: 'Heavy Rainfall Alert',
        message: `Heavy rainfall of ${maxRain}mm expected at ${farm.name}. Protect crops and equipment.`,
      },
    });
  }

  return { current: logs[0], forecast: data.daily };
}

export async function getWeatherLogs(farmId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.weatherLog.findMany({
    where: { farmId, recordedAt: { gte: since } },
    orderBy: { recordedAt: 'desc' },
  });
}

export async function getWeatherAlerts(userId: string) {
  return prisma.weatherAlert.findMany({
    where: { userId },
    orderBy: { triggeredAt: 'desc' },
    take: 50,
  });
}
