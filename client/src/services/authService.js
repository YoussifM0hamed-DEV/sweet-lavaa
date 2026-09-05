import apiClient from './apiClient.js';

export const authService = {
  register: (payload) => apiClient.post('/auth/register', payload),
  login: (payload) => apiClient.post('/auth/login', payload),
  loginWithGoogle: (credential) => apiClient.post('/auth/google', { credential }),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
  changePassword: (payload) => apiClient.patch('/auth/password', payload),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, payload) => apiClient.post(`/auth/reset-password/${token}`, payload),
};

export default authService;
