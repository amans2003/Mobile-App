import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API Base URL - Change this to your backend server address
 * For local development:
 * - Android Emulator: http://10.0.2.2:5001/api
 * - iOS Simulator / Physical Device: http://localhost:5001/api
 * - If using a real device on the same network, use your machine's IP
 */
const API_BASE_URL = 'http://localhost:5001/api';

/**
 * Axios instance configured for the ShopLite API
 */
const API = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Request interceptor - Attach JWT token to every request
 */
API.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH API
// ============================================================

export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);

// ============================================================
// PRODUCTS API
// ============================================================

export const fetchProducts = () => API.get('/products');
export const fetchProductById = (id) => API.get(`/products/${id}`);

export default API;
