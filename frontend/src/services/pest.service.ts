import api from './api';

export const pestService = {
  list: (params?: Record<string, string>) => api.get('/pest/reports', { params }),
  create: (formData: FormData) =>
    api.post('/pest/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  get: (reportId: string) => api.get(`/pest/reports/${reportId}`),
  update: (reportId: string, data: Record<string, unknown>) => api.patch(`/pest/reports/${reportId}`, data),
  resolve: (reportId: string, recommendation?: string) =>
    api.patch(`/pest/reports/${reportId}/resolve`, { recommendation }),
  mapReports: () => api.get('/pest/reports/map'),
};
