import api from './api';

export const communityService = {
  posts: (params?: Record<string, string>) => api.get('/community/posts', { params }),
  createPost: (data: { title: string; body: string; category?: string }) =>
    api.post('/community/posts', data),
  getPost: (postId: string) => api.get(`/community/posts/${postId}`),
  updatePost: (postId: string, data: Record<string, unknown>) =>
    api.patch(`/community/posts/${postId}`, data),
  deletePost: (postId: string) => api.delete(`/community/posts/${postId}`),
  toggleLike: (postId: string) => api.post(`/community/posts/${postId}/like`),
  comments: (postId: string) => api.get(`/community/posts/${postId}/comments`),
  createComment: (postId: string, body: string, parentId?: string) =>
    api.post(`/community/posts/${postId}/comments`, { body, parentId }),
  deleteComment: (commentId: string) => api.delete(`/community/comments/${commentId}`),
  notifications: (unreadOnly?: boolean) =>
    api.get('/community/notifications', { params: unreadOnly ? { unreadOnly: 'true' } : {} }),
  markNotifRead: (notifId: string) => api.patch(`/community/notifications/${notifId}/read`),
  markAllRead: () => api.patch('/community/notifications/read-all'),
};
