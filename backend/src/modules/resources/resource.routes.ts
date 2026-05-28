import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './resource.controller';

const router = Router();
router.use(authenticate);

// GET    /api/v1/resources?farmId=
router.get('/', ctrl.listResources);

// POST   /api/v1/resources
router.post(
  '/',
  [
    body('farmId').isUUID(),
    body('name').trim().notEmpty(),
    body('type').isIn(['WATER','FERTILIZER','PESTICIDE','EQUIPMENT','SEED','FUEL','OTHER']),
    body('unit').trim().notEmpty(),
    body('quantity').isFloat({ min: 0 }),
  ],
  validate,
  ctrl.createResource
);

// GET    /api/v1/resources/:resourceId
router.get('/:resourceId', ctrl.getResource);

// PATCH  /api/v1/resources/:resourceId
router.patch('/:resourceId', ctrl.updateResource);

// DELETE /api/v1/resources/:resourceId
router.delete('/:resourceId', ctrl.deleteResource);

// POST   /api/v1/resources/:resourceId/usage
router.post(
  '/:resourceId/usage',
  [
    body('quantityUsed').isFloat({ min: 0.01 }),
    body('purpose').optional().trim(),
  ],
  validate,
  ctrl.logUsage
);

// GET    /api/v1/resources/:resourceId/usage
router.get('/:resourceId/usage', ctrl.getUsageLogs);

export default router;
