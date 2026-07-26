import { createContext, useContext, useState, useEffect } from 'react';
import { loginAdmin } from '../services/api';

const AuthContext = createContext();

/**
 * AuthProvider - Manages Admin & HR authentication state
 * Stores token and user data in localStorage
 * Strictly restricted to two portal roles: Super Admin and HR Manager
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  /**
   * Login admin/HR user
   * @param {string} email
   * @param {string} password
   */
  const login = async (email, password) => {
    const { data } = await loginAdmin({ email, password });

    // Strictly authorize ONLY two dashboard roles: Admin and HR Manager
    const allowedRoles = ['super_admin', 'hr_manager'];
    if (!allowedRoles.includes(data.role)) {
      throw new Error('Access denied. Web portal access is strictly restricted to Admin and HR Managers.');
    }

    // Store token and user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setToken(data.token);
    setUser(data);
  };

  /**
   * Logout user
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  /**
   * Check if user has one of the required roles
   */
  const hasRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
