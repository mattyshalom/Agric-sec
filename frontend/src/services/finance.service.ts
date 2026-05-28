import api from './api';

export const financeService = {
  transactions: (params: Record<string, string>) => api.get('/finance/transactions', { params }),
  createTransaction: (data: Record<string, unknown>) => api.post('/finance/transactions', data),
  updateTransaction: (txId: string, data: Record<string, unknown>) =>
    api.patch(`/finance/transactions/${txId}`, data),
  deleteTransaction: (txId: string) => api.delete(`/finance/transactions/${txId}`),
  summary: (farmId: string, year?: number) =>
    api.get('/finance/summary', { params: { farmId, ...(year && { year }) } }),
  budget: (farmId: string) => api.get('/finance/budget', { params: { farmId } }),
  upsertBudget: (data: { farmId: string; totalBudget: number; year: number; notes?: string }) =>
    api.post('/finance/budget', data),
};
