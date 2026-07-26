import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API Base URL — Enterprise HRIS Backend
 * 
 * Notice: Using your Mac's Local IP (192.168.0.154:5001) so your phone can immediately test
 * all new HRIS features (Attendance, Time Off, Salary) running on your local backend server!
 * Ensure your phone is connected to the same Wi-Fi network as your computer.
 * 
 * If you deploy the backend updates to Render, you can switch back to:
 * const API_BASE_URL = 'https://mobile-app-999f.onrender.com/api';
 */
const API_BASE_URL = 'http://192.168.0.154:5001/api';

/**
 * Axios instance configured for the Enterprise HRIS API
 */
const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
      console.log('Error reading token:', error?.message);
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
export const getMyProfile = () => API.get('/auth/me');

// ============================================================
// EMPLOYEES / DIRECTORY API
// ============================================================
export const fetchEmployees = (params) => API.get('/employees', { params });
export const fetchEmployeeById = (id) => API.get(`/employees/${id}`);

// ============================================================
// ATTENDANCE API
// ============================================================
export const checkIn = (data) => API.post('/attendance/check-in', data);
export const checkOut = (data) => API.post('/attendance/check-out', data);
export const getMyTodayAttendance = () => API.get('/attendance/today');
export const getMyAttendanceHistory = (params) => API.get('/attendance/my-history', { params });

// ============================================================
// LEAVE API
// ============================================================
export const applyLeave = (data) => API.post('/leaves', data);
export const getMyLeaves = () => API.get('/leaves/my');
export const cancelLeave = (id) => API.put(`/leaves/${id}/cancel`);

// ============================================================
// PAYROLL / SALARY API
// ============================================================
export const getMySalary = () => API.get('/payroll/my');

// ============================================================
// EXPENSES API
// ============================================================
export const submitExpense = (data) => API.post('/expenses', data);
export const getMyExpenses = () => API.get('/expenses/my');
export const uploadExpenseReceipt = (formData) => API.post('/expenses/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// ============================================================
// MEETINGS API
// ============================================================
export const createMeeting = (data) => API.post('/meetings', data);
export const getMyMeetings = () => API.get('/meetings/my');
export const rsvpMeeting = (id, data) => API.put(`/meetings/${id}/rsvp`, data);
export const cancelMeeting = (id) => API.put(`/meetings/${id}/cancel`);

// ============================================================
// ANNOUNCEMENTS API
// ============================================================
export const getAnnouncements = () => API.get('/announcements');

export default API;
