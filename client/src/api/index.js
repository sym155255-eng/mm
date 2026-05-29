import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err.response?.data || err)
);

export const authApi = {
  login: data => api.post('/login', data),
  register: data => api.post('/register', data),
};

export const linksApi = {
  getGrouped: () => api.get('/links/grouped'),
  getList: params => api.get('/links', { params }),
  click: id => api.post(`/links/${id}/click`),
  create: data => api.post('/admin/links', data),
  update: (id, data) => api.put(`/admin/links/${id}`, data),
  delete: id => api.delete(`/admin/links/${id}`),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  create: data => api.post('/admin/categories', data),
  update: (id, data) => api.put(`/admin/categories/${id}`, data),
  delete: id => api.delete(`/admin/categories/${id}`),
};

export const settingsApi = {
  get: () => api.get('/settings'),
  save: data => api.put('/admin/settings', data),
};

export const linkItemsApi = {
  getByLink: linkId => api.get(`/admin/link-items/by-link/${linkId}`),
  create: data => api.post('/admin/link-items', data),
  update: (id, data) => api.put(`/admin/link-items/${id}`, data),
  delete: id => api.delete(`/admin/link-items/${id}`),
};

export const adsApi = {
  getEnabled: () => api.get('/ads'),
  getAll: () => api.get('/admin/ads/all'),
  create: data => api.post('/admin/ads', data),
  update: (id, data) => api.put(`/admin/ads/${id}`, data),
  delete: id => api.delete(`/admin/ads/${id}`),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: id => api.delete(`/admin/users/${id}`),
  resetPassword: newPassword => api.post('/admin/reset-admin-password', { newPassword }),
};
