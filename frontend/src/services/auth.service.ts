import api from './api';

export interface RegisterPayload {
  email: string; password: string; firstName: string; lastName: string; phone?: string;
}
export interface LoginPayload { email: string; password: string; }

export const authService = {
  register: (data: RegisterPayload) => api.post('/auth/register', data),
  login: (data: LoginPayload) => api.post('/auth/login', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: Partial<{ firstName: string; lastName: string; phone: string; avatarUrl: string }>) =>
    api.patch('/auth/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};
