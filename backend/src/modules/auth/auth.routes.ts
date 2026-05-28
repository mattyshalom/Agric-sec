import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './auth.controller';

const router = Router();

// POST /api/v1/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('phone').optional().isMobilePhone('any'),
  ],
  validate,
  ctrl.register
);

// POST /api/v1/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  ctrl.login
);

// POST /api/v1/auth/refresh
router.post('/refresh', ctrl.refreshToken);

// POST /api/v1/auth/logout
router.post('/logout', authenticate, ctrl.logout);

// GET  /api/v1/auth/me
router.get('/me', authenticate, ctrl.getMe);

// PATCH /api/v1/auth/me
router.patch(
  '/me',
  authenticate,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('phone').optional().isMobilePhone('any'),
  ],
  validate,
  ctrl.updateMe
);

// POST /api/v1/auth/change-password
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  validate,
  ctrl.changePassword
);

export default router;
