import apiClient from './apiClient.js';

/** Shared multipart helper with upload-progress reporting. */
const upload = (url, formData, onProgress) =>
  apiClient.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) onProgress(Math.round((event.loaded * 100) / event.total));
    },
  });

export const adminStatsService = {
  overview: () => apiClient.get('/admin/stats/overview'),
  sales: (days = 30) => apiClient.get('/admin/stats/sales', { params: { days } }),
  topProducts: (limit = 8) => apiClient.get('/admin/stats/top-products', { params: { limit } }),
  revenueByCategory: () => apiClient.get('/admin/stats/revenue-by-category'),
  zones: () => apiClient.get('/admin/stats/zones'),
  customers: () => apiClient.get('/admin/stats/customers'),
  recentOrders: (limit = 6) => apiClient.get('/admin/stats/recent-orders', { params: { limit } }),
};

export const adminProductService = {
  list: (params) => apiClient.get('/products/admin/list', { params }),
  getOne: (id) => apiClient.get(`/products/admin/${id}`),
  create: (payload) => apiClient.post('/products', payload),
  update: (id, payload) => apiClient.patch(`/products/${id}`, payload),
  remove: (id) => apiClient.delete(`/products/${id}`),
  toggleStatus: (id) => apiClient.patch(`/products/${id}/status`),
  updateStock: (id, payload) => apiClient.patch(`/products/${id}/stock`, payload),
  bulkStock: (updates) => apiClient.post('/products/bulk/stock', { updates }),
  uploadImages: (id, files, onProgress) => {
    const form = new FormData();
    files.forEach((file) => form.append('images', file));
    return upload(`/products/${id}/images`, form, onProgress);
  },
  deleteImage: (id, imageId) => apiClient.delete(`/products/${id}/images/${imageId}`),
  setPrimaryImage: (id, imageId) => apiClient.patch(`/products/${id}/images/${imageId}/primary`),
};

export const adminCategoryService = {
  list: () => apiClient.get('/categories/admin/list'),
  create: (payload) => apiClient.post('/categories', payload),
  update: (id, payload) => apiClient.patch(`/categories/${id}`, payload),
  remove: (id) => apiClient.delete(`/categories/${id}`),
  toggleStatus: (id) => apiClient.patch(`/categories/${id}/status`),
  reorder: (order) => apiClient.patch('/categories/reorder', { order }),
  uploadImage: (id, file, onProgress) => {
    const form = new FormData();
    form.append('image', file);
    return upload(`/categories/${id}/image`, form, onProgress);
  },
};

export const adminOrderService = {
  list: (params) => apiClient.get('/orders/admin/list', { params }),
  getOne: (id) => apiClient.get(`/orders/admin/${id}`),
  updateStatus: (id, payload) => apiClient.patch(`/orders/admin/${id}/status`, payload),
  updatePayment: (id, payload) => apiClient.patch(`/orders/admin/${id}/payment`, payload),
  addNote: (id, note) => apiClient.patch(`/orders/admin/${id}/note`, { note }),
  forCustomer: (id) => apiClient.get(`/orders/admin/customer/${id}`),
};

export const adminCustomerService = {
  list: (params) => apiClient.get('/admin/customers', { params }),
  getOne: (id) => apiClient.get(`/admin/customers/${id}`),
  toggleStatus: (id) => apiClient.patch(`/admin/customers/${id}/status`),
};

export const adminUserService = {
  staff: (params) => apiClient.get('/admin/staff', { params }),
  roles: () => apiClient.get('/admin/roles'),
  create: (payload) => apiClient.post('/admin/staff', payload),
  updateRole: (id, payload) => apiClient.patch(`/admin/staff/${id}/role`, payload),
  remove: (id) => apiClient.delete(`/admin/staff/${id}`),
};

export const adminCouponService = {
  list: (params) => apiClient.get('/coupons/admin/list', { params }),
  getOne: (id) => apiClient.get(`/coupons/admin/${id}`),
  create: (payload) => apiClient.post('/coupons', payload),
  update: (id, payload) => apiClient.patch(`/coupons/${id}`, payload),
  remove: (id) => apiClient.delete(`/coupons/${id}`),
  toggleStatus: (id) => apiClient.patch(`/coupons/${id}/status`),
};

export const adminZoneService = {
  list: () => apiClient.get('/delivery-zones/admin/list'),
  create: (payload) => apiClient.post('/delivery-zones', payload),
  update: (id, payload) => apiClient.patch(`/delivery-zones/${id}`, payload),
  remove: (id) => apiClient.delete(`/delivery-zones/${id}`),
  toggleStatus: (id) => apiClient.patch(`/delivery-zones/${id}/status`),
};

export const adminInventoryService = {
  list: (params) => apiClient.get('/admin/inventory', { params }),
  overview: () => apiClient.get('/admin/inventory/overview'),
  alerts: () => apiClient.get('/admin/inventory/alerts'),
};

export const adminReviewService = {
  list: (params) => apiClient.get('/reviews/admin/list', { params }),
  moderate: (id, payload) => apiClient.patch(`/reviews/admin/${id}`, payload),
  remove: (id) => apiClient.delete(`/reviews/admin/${id}`),
};

export const adminSettingsService = {
  get: () => apiClient.get('/settings/admin'),
  update: (payload) => apiClient.patch('/settings/admin', payload),
  uploadBranding: (field, file, onProgress) => {
    const form = new FormData();
    form.append('image', file);
    return upload(`/settings/admin/branding/${field}`, form, onProgress);
  },
};

export const adminInboxService = {
  messages: (params) => apiClient.get('/admin/messages', { params }),
  updateMessage: (id, status) => apiClient.patch(`/admin/messages/${id}`, { status }),
  subscribers: (params) => apiClient.get('/admin/subscribers', { params }),
};
