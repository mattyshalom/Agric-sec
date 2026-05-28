import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './community.controller';

const router = Router();
router.use(authenticate);

// ─── Posts ────────────────────────────────────────────────────────
// GET    /api/v1/community/posts?category=&page=
router.get('/posts', ctrl.listPosts);

// POST   /api/v1/community/posts
router.post(
  '/posts',
  [
    body('title').trim().isLength({ min: 5, max: 200 }),
    body('body').trim().isLength({ min: 10 }),
    body('category').optional().isIn(['GENERAL','ADVISORY','QUESTION','MARKET_INSIGHT','WEATHER_UPDATE']),
  ],
  validate,
  ctrl.createPost
);

// GET    /api/v1/community/posts/:postId
router.get('/posts/:postId', ctrl.getPost);

// PATCH  /api/v1/community/posts/:postId
router.patch('/posts/:postId', ctrl.updatePost);

// DELETE /api/v1/community/posts/:postId
router.delete('/posts/:postId', ctrl.deletePost);

// POST   /api/v1/community/posts/:postId/like
router.post('/posts/:postId/like', ctrl.toggleLike);

// ─── Comments ────────────────────────────────────────────────────
// GET    /api/v1/community/posts/:postId/comments
router.get('/posts/:postId/comments', ctrl.listComments);

// POST   /api/v1/community/posts/:postId/comments
router.post(
  '/posts/:postId/comments',
  [body('body').trim().isLength({ min: 1 })],
  validate,
  ctrl.createComment
);

// DELETE /api/v1/community/comments/:commentId
router.delete('/comments/:commentId', ctrl.deleteComment);

// ─── Notifications ───────────────────────────────────────────────
// GET    /api/v1/community/notifications
router.get('/notifications', ctrl.listNotifications);

// PATCH  /api/v1/community/notifications/:notifId/read
router.patch('/notifications/:notifId/read', ctrl.markNotificationRead);

// PATCH  /api/v1/community/notifications/read-all
router.patch('/notifications/read-all', ctrl.markAllRead);

export default router;
