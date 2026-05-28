import api from './api';

export const weatherService = {
  forecast: (farmId: string) => api.get(`/weather/farms/${farmId}/forecast`),
  logs: (farmId: string, days = 7) => api.get(`/weather/farms/${farmId}/logs?days=${days}`),
  alerts: () => api.get('/weather/alerts'),
  markAlertRead: (alertId: string) => api.patch(`/weather/alerts/${alertId}/read`),
};
