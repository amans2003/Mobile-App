import axios from 'axios';

/**
 * Safely extract base URL from Vite environment variables or default to local server
 */
const getBaseUrl = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
      let url = String(import.meta.env.VITE_API_BASE_URL).trim();
      if (url) {
        url = url.replace(/\/+$/, '');
        // Automatically append /api if omitted in Render or Vercel environment variables
        if (!url.endsWith('/api')) {
          url += '/api';
        }
        return url;
      }
    }
  } catch (e) {
    console.warn('Could not read Vite environment variables:', e);
  }
  // Fallback directly to live cloud server or local server
  return 'https://mobile-app-999f.onrender.com/api';
};

/**
 * Axios instance configured for the Enterprise HRIS API
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
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
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

export function getProfile() {
  return apiClient.get('/auth/me');
}

// ============================================================
// EMPLOYEES API
// ============================================================
export function fetchEmployees(params) {
  return apiClient.get('/employees', { params });
}

export function fetchEmployeeById(id) {
  return apiClient.get(`/employees/${id}`);
}

export function createEmployee(data) {
  return apiClient.post('/employees', data);
}

export function updateEmployee(id, data) {
  return apiClient.put(`/employees/${id}`, data);
}

export function deleteEmployee(id) {
  return apiClient.delete(`/employees/${id}`);
}

export function fetchEmployeeStats() {
  return apiClient.get('/employees/stats');
}

// ============================================================
// ATTENDANCE API
// ============================================================
export function fetchAttendanceLogs(params) {
  return apiClient.get('/attendance/logs', { params });
}

// Alias for fetchAttendanceLogs
export const fetchAllAttendance = fetchAttendanceLogs;

export function fetchAttendanceStats() {
  return apiClient.get('/attendance/stats');
}

export function fetchAttendanceRules() {
  return apiClient.get('/attendance/rules');
}

export function updateAttendanceRules(data) {
  return apiClient.put('/attendance/rules', data);
}

export function updateAttendanceStatus(id, data) {
  return apiClient.put(`/attendance/${id}/status`, data);
}

// Alias for updateAttendanceStatus
export const overrideAttendance = updateAttendanceStatus;

export function checkIn(data) {
  return apiClient.post('/attendance/check-in', data);
}

export function checkOut(data) {
  return apiClient.post('/attendance/check-out', data);
}

// ============================================================
// LEAVE API
// ============================================================
export function fetchAllLeaves(params) {
  return apiClient.get('/leaves', { params });
}

export function reviewLeave(id, data) {
  return apiClient.put(`/leaves/${id}/review`, data);
}

// ============================================================
// PAYROLL API
// ============================================================
export function generatePayroll(data) {
  return apiClient.post('/payroll/generate', data);
}

export function fetchPayrollRecords(params) {
  return apiClient.get('/payroll', { params });
}

export function fetchPayrollStats(params) {
  return apiClient.get('/payroll/stats', { params });
}

// ============================================================
// EXPENSES API
// ============================================================
export function fetchAllExpenses(params) {
  return apiClient.get('/expenses', { params });
}

export function reviewExpense(id, data) {
  return apiClient.put(`/expenses/${id}/review`, data);
}

export function uploadAdminExpenseDoc(id, formData) {
  return apiClient.put(`/expenses/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// ============================================================
// MEETINGS API
// ============================================================
export function fetchAllMeetings() {
  return apiClient.get('/meetings');
}

export function createMeeting(data) {
  return apiClient.post('/meetings', data);
}

export function updateMeeting(id, data) {
  return apiClient.put(`/meetings/${id}`, data);
}

export function cancelMeeting(id) {
  return apiClient.put(`/meetings/${id}/cancel`);
}

// ============================================================
// ANNOUNCEMENTS API
// ============================================================
export function fetchAnnouncements(params) {
  return apiClient.get('/announcements', { params });
}

export function createAnnouncement(data) {
  return apiClient.post('/announcements', data);
}

export function updateAnnouncement(id, data) {
  return apiClient.put(`/announcements/${id}`, data);
}

export function deleteAnnouncement(id) {
  return apiClient.delete(`/announcements/${id}`);
}

export default apiClient;
