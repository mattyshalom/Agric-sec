import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './pest.controller';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, process.env.UPLOAD_DIR || './uploads'),
  filename: (_, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = /jpg|jpeg|png|webp/i;
    cb(null, allowed.test(file.mimetype));
  },
});

const router = Router();
router.use(authenticate);

// GET  /api/v1/pest/reports?farmId=&status=&page=
router.get('/reports', ctrl.listReports);

// POST /api/v1/pest/reports  (with optional image upload)
router.post(
  '/reports',
  upload.array('images', 5),
  [
    body('farmId').isUUID(),
    body('pestName').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('severity').isIn(['INFO', 'WARNING', 'CRITICAL']),
  ],
  validate,
  ctrl.createReport
);

// GET  /api/v1/pest/reports/:reportId
router.get('/reports/:reportId', ctrl.getReport);

// PATCH /api/v1/pest/reports/:reportId
router.patch('/reports/:reportId', ctrl.updateReport);

// PATCH /api/v1/pest/reports/:reportId/resolve
router.patch('/reports/:reportId/resolve', ctrl.resolveReport);

// GET  /api/v1/pest/reports/map  — all open reports with coords for map display
router.get('/reports/map', ctrl.getMapReports);

export default router;
