import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './crop.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

// All routes are under /api/v1/farms/:farmId/crops

// GET    /api/v1/farms/:farmId/crops
router.get('/:farmId/crops', ctrl.listCrops);

// POST   /api/v1/farms/:farmId/crops
router.post(
  '/:farmId/crops',
  [
    param('farmId').isUUID(),
    body('name').trim().notEmpty(),
    body('plotAreaHectares').isFloat({ min: 0.01 }),
    body('status').optional().isIn(['PLANNED', 'PLANTED', 'GROWING', 'HARVESTED', 'FAILED']),
    body('plantedAt').optional().isISO8601(),
    body('expectedHarvestAt').optional().isISO8601(),
  ],
  validate,
  ctrl.createCrop
);

// GET    /api/v1/farms/:farmId/crops/:cropId
router.get('/:farmId/crops/:cropId', ctrl.getCrop);

// PATCH  /api/v1/farms/:farmId/crops/:cropId
router.patch('/:farmId/crops/:cropId', ctrl.updateCrop);

// DELETE /api/v1/farms/:farmId/crops/:cropId
router.delete('/:farmId/crops/:cropId', ctrl.deleteCrop);

export default router;
