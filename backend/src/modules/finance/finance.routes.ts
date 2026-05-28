import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './finance.controller';

const router = Router();
router.use(authenticate);

// GET    /api/v1/finance/transactions?farmId=&type=&page=
router.get('/transactions', ctrl.listTransactions);

// POST   /api/v1/finance/transactions
router.post(
  '/transactions',
  [
    body('farmId').isUUID(),
    body('type').isIn(['INCOME', 'EXPENSE']),
    body('category').trim().notEmpty(),
    body('amount').isFloat({ min: 0.01 }),
    body('transactedAt').isISO8601(),
  ],
  validate,
  ctrl.createTransaction
);

// GET    /api/v1/finance/transactions/:txId
router.get('/transactions/:txId', ctrl.getTransaction);

// PATCH  /api/v1/finance/transactions/:txId
router.patch('/transactions/:txId', ctrl.updateTransaction);

// DELETE /api/v1/finance/transactions/:txId
router.delete('/transactions/:txId', ctrl.deleteTransaction);

// GET    /api/v1/finance/summary?farmId=&year=
router.get('/summary', ctrl.getSummary);

// GET    /api/v1/finance/budget?farmId=
router.get('/budget', ctrl.getBudget);

// POST   /api/v1/finance/budget
router.post(
  '/budget',
  [body('farmId').isUUID(), body('totalBudget').isFloat({ min: 0 }), body('year').isInt()],
  validate,
  ctrl.upsertBudget
);

export default router;
