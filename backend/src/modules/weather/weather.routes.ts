import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './weather.service';
import prisma from '../../config/database';

const router = Router();
router.use(authenticate);

// GET /api/v1/weather/farms/:farmId/forecast   — fetch & return 7-day forecast
router.get('/farms/:farmId/forecast', asyncHandler(async (req, res) => {
  const result = await service.fetchAndStoreForecast(req.params.farmId, req.user!.id);
  res.json({ success: true, data: result });
}));

// GET /api/v1/weather/farms/:farmId/logs?days=7
router.get('/farms/:farmId/logs', asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days as string) || 7;
  const logs = await service.getWeatherLogs(req.params.farmId, days);
  res.json({ success: true, data: logs });
}));

// GET /api/v1/weather/alerts
router.get('/alerts', asyncHandler(async (req, res) => {
  const alerts = await service.getWeatherAlerts(req.user!.id);
  res.json({ success: true, data: alerts });
}));

// PATCH /api/v1/weather/alerts/:alertId/read
router.patch('/alerts/:alertId/read', asyncHandler(async (req, res) => {
  await prisma.weatherAlert.update({
    where: { id: req.params.alertId },
    data: { isRead: true },
  });
  res.json({ success: true });
}));

export default router;
