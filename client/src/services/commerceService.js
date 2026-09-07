import apiClient from './apiClient.js';

export const cartService = {
  get: () => apiClient.get('/cart'),
  addItem: (payload) => apiClient.post('/cart/items', payload),
  updateItem: (productId, payload) => apiClient.patch(`/cart/items/${productId}`, payload),
  removeItem: (productId, variantId) =>
    apiClient.delete(`/cart/items/${productId}`, { params: variantId ? { variantId } : {} }),
  clear: () => apiClient.delete('/cart'),
  merge: (items) => apiClient.post('/cart/merge', { items }),
  applyCoupon: (code) => apiClient.post('/cart/coupon', { code }),
  removeCoupon: () => apiClient.delete('/cart/coupon'),
  quote: (payload) => apiClient.post('/cart/quote', payload),
};

export const wishlistService = {
  get: () => apiClient.get('/wishlist'),
  ids: () => apiClient.get('/wishlist/ids'),
  add: (productId) => apiClient.post(`/wishlist/${productId}`),
  remove: (productId) => apiClient.delete(`/wishlist/${productId}`),
  clear: () => apiClient.delete('/wishlist'),
};

export const orderService = {
  create: (payload) => apiClient.post('/orders', payload),
  mine: (params) => apiClient.get('/orders/my', { params }),
  getOne: (id) => apiClient.get(`/orders/${id}`),
  track: (orderNumber) => apiClient.get(`/orders/track/${orderNumber}`),
  cancel: (id, reason) => apiClient.patch(`/orders/${id}/cancel`, { reason }),
  reviewable: () => apiClient.get('/orders/my/reviewable'),
};


export const couponService = {
  check: (code) => apiClient.post('/coupons/check', { code }),
};

export const userService = {
  updateProfile: (payload) => apiClient.patch('/users/profile', payload),
  updateAvatar: (file) => {
    const form = new FormData();
    form.append('image', file);
    return apiClient.patch('/users/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  stats: () => apiClient.get('/users/stats'),
  addresses: () => apiClient.get('/users/addresses'),
  addAddress: (payload) => apiClient.post('/users/addresses', payload),
  updateAddress: (id, payload) => apiClient.patch(`/users/addresses/${id}`, payload),
  deleteAddress: (id) => apiClient.delete(`/users/addresses/${id}`),
  setDefaultAddress: (id) => apiClient.patch(`/users/addresses/${id}/default`),
  deleteMyAccount: () => apiClient.delete('/users/me'),
};
