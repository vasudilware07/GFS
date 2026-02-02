import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Product APIs
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  getById: (id) => api.get(`/products/${id}`),
  create: (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStock: (id, data) => api.put(`/products/${id}/stock`, data),
  deleteMedia: (id, data) => api.delete(`/products/${id}/media`, { data }),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/admin/low-stock'),
};

// Order APIs
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getMyOrders: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
  generateInvoice: (id, data) => api.post(`/orders/${id}/invoice`, data),
  verifyPayment: (id, data) => api.post(`/orders/${id}/verify-payment`, data),
};

// Invoice APIs
export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getMyInvoices: (params) => api.get('/invoices', { params }),
  getOne: (id) => api.get(`/invoices/${id}`),
  download: (id) => api.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  resend: (id) => api.post(`/invoices/${id}/resend`),
  updateStatus: (id, status) => api.put(`/invoices/${id}/status`, { status }),
  sendReminder: (id) => api.post(`/invoices/${id}/reminder`),
  getOverdue: () => api.get('/invoices/admin/overdue'),
  getDueSoon: (days) => api.get('/invoices/admin/due-soon', { params: { days } }),
};

// Payment APIs
export const paymentAPI = {
  create: (data) => api.post('/payments', data),
  record: (data) => api.post('/payments', data),
  getAll: (params) => api.get('/payments', { params }),
  getOne: (id) => api.get(`/payments/${id}`),
  resendReceipt: (id) => api.post(`/payments/${id}/resend`),
  getSummary: (params) => api.get('/payments/admin/summary', { params }),
};

// User APIs (Admin)
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleBlock: (id) => api.put(`/users/${id}/block`),
  updateCreditLimit: (id, creditLimit) => api.put(`/users/${id}/credit-limit`, { creditLimit }),
  delete: (id) => api.delete(`/users/${id}`),
  getWithDues: () => api.get('/users/with-dues'),
};

// KYC APIs
export const kycAPI = {
  getStatus: () => api.get('/kyc/status'),
  submit: (formData) => api.post('/kyc/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Admin
  getAll: (params) => api.get('/kyc/admin/all', { params }),
  getPendingCount: () => api.get('/kyc/admin/pending-count'),
  getDetails: (userId) => api.get(`/kyc/admin/${userId}`),
  approve: (userId) => api.put(`/kyc/admin/${userId}/approve`),
  reject: (userId, reason) => api.put(`/kyc/admin/${userId}/reject`, { reason }),
};

// Report APIs (Admin)
export const reportAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getSales: (params) => api.get('/reports/sales', { params }),
  getDues: () => api.get('/reports/dues'),
  getTopProducts: (params) => api.get('/reports/top-products', { params }),
  getProfit: (params) => api.get('/reports/profit', { params }),
};

export default api;
