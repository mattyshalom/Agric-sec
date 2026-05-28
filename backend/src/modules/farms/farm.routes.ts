import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './farm.controller';

const router = Router();

router.use(authenticate);

// GET    /api/v1/farms
router.get('/', ctrl.listFarms);

// POST   /api/v1/farms
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('areaHectares').isFloat({ min: 0.01 }),
    body('country').trim().notEmpty(),
    body('region').trim().notEmpty(),
  ],
  validate,
  ctrl.createFarm
);

// GET    /api/v1/farms/:farmId
router.get('/:farmId', param('farmId').isUUID(), validate, ctrl.getFarm);

// PATCH  /api/v1/farms/:farmId
router.patch(
  '/:farmId',
  [param('farmId').isUUID(), body('name').optional().trim().notEmpty()],
  validate,
  ctrl.updateFarm
);

// DELETE /api/v1/farms/:farmId
router.delete('/:farmId', param('farmId').isUUID(), validate, ctrl.deleteFarm);

// GET    /api/v1/farms/:farmId/summary  (dashboard stats for one farm)
router.get('/:farmId/summary', param('farmId').isUUID(), validate, ctrl.getFarmSummary);

export default router;
