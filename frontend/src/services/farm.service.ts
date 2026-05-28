import api from './api';

export interface FarmPayload {
  name: string; description?: string; latitude: number; longitude: number;
  areaHectares: number; country: string; region: string; soilType?: string; address?: string;
}

export const farmService = {
  list: () => api.get('/farms'),
  create: (data: FarmPayload) => api.post('/farms', data),
  get: (farmId: string) => api.get(`/farms/${farmId}`),
  update: (farmId: string, data: Partial<FarmPayload>) => api.patch(`/farms/${farmId}`, data),
  delete: (farmId: string) => api.delete(`/farms/${farmId}`),
  summary: (farmId: string) => api.get(`/farms/${farmId}/summary`),
};
