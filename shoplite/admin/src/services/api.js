import axios from 'axios';

/**
 * Axios instance configured for the ShopLite API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const API = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Request interceptor - Attach JWT token to every request
 */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle 401 errors (expired/invalid token)
 */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH API
// ============================================================

export const loginAdmin = (data) => API.post('/auth/login', data);

// ============================================================
// PRODUCTS API
// ============================================================

export const fetchProducts = () => API.get('/products');
export const fetchProductById = (id) => API.get(`/products/${id}`);
export const createProduct = (formData) =>
  API.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateProduct = (id, formData) =>
  API.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteProduct = (id) => API.delete(`/products/${id}`);

// ============================================================
// USERS API
// ============================================================

export const fetchUsers = () => API.get('/users');
export const fetchUserCount = () => API.get('/users/count');

export default API;
