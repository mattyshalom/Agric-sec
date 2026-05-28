import { Router } from 'express';
import { body, query } from 'express-validator';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './market.service';

const router = Router();
router.use(authenticate);

// GET /api/v1/market/prices?commodity=maize&country=NG&page=1&limit=20
router.get('/prices', asyncHandler(async (req, res) => {
  const result = await service.getPrices(req.query as Record<string, string>);
  res.json({ success: true, data: result });
}));

// GET /api/v1/market/prices/latest — latest price per commodity/country
router.get('/prices/latest', asyncHandler(async (req, res) => {
  const data = await service.getLatestPrices(req.query.country as string);
  res.json({ success: true, data });
}));

// POST /api/v1/market/prices  — admin/agronomist only
router.post(
  '/prices',
  authorize('ADMIN', 'AGRONOMIST'),
  [
    body('commodity').trim().notEmpty(),
    body('market').trim().notEmpty(),
    body('country').trim().notEmpty(),
    body('pricePerKg').isFloat({ min: 0 }),
    body('recordedAt').isISO8601(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const data = await service.createPrice(req.body);
    res.status(201).json({ success: true, data });
  })
);

// GET  /api/v1/market/price-alerts
router.get('/price-alerts', asyncHandler(async (req, res) => {
  const alerts = await service.getUserPriceAlerts(req.user!.id);
  res.json({ success: true, data: alerts });
}));

// POST /api/v1/market/price-alerts
router.post(
  '/price-alerts',
  [
    body('commodity').trim().notEmpty(),
    body('country').trim().notEmpty(),
    body('targetPrice').isFloat({ min: 0 }),
    body('condition').isIn(['above', 'below']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const alert = await service.createPriceAlert({ ...req.body, userId: req.user!.id });
    res.status(201).json({ success: true, data: alert });
  })
);

// DELETE /api/v1/market/price-alerts/:alertId
router.delete('/price-alerts/:alertId', asyncHandler(async (req, res) => {
  await service.deletePriceAlert(req.params.alertId, req.user!.id);
  res.json({ success: true });
}));

export default router;
