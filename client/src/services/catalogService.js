import apiClient from './apiClient.js';

export const productService = {
  list: (params) => apiClient.get('/products', { params }),
  getBySlug: (slug) => apiClient.get(`/products/${slug}`),
  collection: (name, limit = 8) => apiClient.get(`/products/collection/${name}`, { params: { limit } }),
  suggestions: (q) => apiClient.get('/products/search/suggestions', { params: { q } }),
  priceRange: () => apiClient.get('/products/price-range'),
  recentlyViewed: (ids) => apiClient.get('/products/recently-viewed', { params: { ids: ids.join(',') } }),
};

export const categoryService = {
  list: (params) => apiClient.get('/categories', { params }),
  getBySlug: (slug) => apiClient.get(`/categories/${slug}`),
};

export const reviewService = {
  forProduct: (productId, params) => apiClient.get(`/reviews/product/${productId}`, { params }),
  create: (payload) => apiClient.post('/reviews', payload),
  update: (id, payload) => apiClient.patch(`/reviews/${id}`, payload),
  remove: (id) => apiClient.delete(`/reviews/${id}`),
  mine: () => apiClient.get('/reviews/my'),
};

export const deliveryZoneService = {
  list: () => apiClient.get('/delivery-zones'),
};

export const settingsService = {
  get: () => apiClient.get('/settings'),
};

export const miscService = {
  subscribe: (email, source = 'homepage') => apiClient.post('/newsletter/subscribe', { email, source }),
  contact: (payload) => apiClient.post('/contact', payload),
};
