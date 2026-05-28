import api from './api';

export const marketService = {
  prices: (params?: Record<string, string>) =>
    api.get('/market/prices', { params }),
  latestPrices: (country?: string) =>
    api.get('/market/prices/latest', { params: country ? { country } : {} }),
  priceAlerts: () => api.get('/market/price-alerts'),
  createPriceAlert: (data: { commodity: string; country: string; targetPrice: number; condition: string }) =>
    api.post('/market/price-alerts', data),
  deletePriceAlert: (alertId: string) => api.delete(`/market/price-alerts/${alertId}`),
};
