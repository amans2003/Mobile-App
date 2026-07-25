import axios from 'axios';

/**
 * Safely extract base URL from Vite environment variables or default to localhost
 */
const getBaseUrl = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL;
    }
  } catch (e) {
    console.warn('Could not read Vite environment variables:', e);
  }
  return 'http://localhost:5001/api';
};

/**
 * Axios instance configured for the ShopLite API
 * Using var/explicit function scope to avoid Vite/Rollup production temporal dead zone hoisting bugs
 */
var apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Attach JWT token to every request
apiClient.interceptors.request.use(
  function (config) {
    try {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error attaching authorization token:', error);
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors (expired/invalid token)
apiClient.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (error.response && error.response.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH API
// ============================================================
export function loginAdmin(data) {
  return apiClient.post('/auth/login', data);
}

// ============================================================
// PRODUCTS API
// ============================================================
export function fetchProducts() {
  return apiClient.get('/products');
}

export function fetchProductById(id) {
  return apiClient.get(`/products/${id}`);
}

export function createProduct(formData) {
  return apiClient.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function updateProduct(id, formData) {
  return apiClient.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function deleteProduct(id) {
  return apiClient.delete(`/products/${id}`);
}

// ============================================================
// USERS API
// ============================================================
export function fetchUsers() {
  return apiClient.get('/users');
}

export function fetchUserCount() {
  return apiClient.get('/users/count');
}

export default apiClient;
