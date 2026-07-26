import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser, getMyProfile } from '../services/api';

const AuthContext = createContext();

/**
 * AuthProvider — Enterprise HRIS Mobile Auth
 * Manages employee authentication state with expanded RBAC fields & pending approval workflow
 * Persists token and user data in AsyncStorage
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user and token from AsyncStorage on mount
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          // Proactively fetch latest profile updates (leave balances, salary, role) from backend server
          try {
            const res = await getMyProfile();
            if (res?.data) {
              const merged = { ...parsed, ...res.data };
              await AsyncStorage.setItem('user', JSON.stringify(merged));
              setUser(merged);
            }
          } catch (syncErr) {
            console.log('Notice background profile sync:', syncErr?.message);
          }
        }
      } catch (err) {
        console.log('Notice loading auth data:', err?.message);
      } finally {
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

  /**
   * Login user with safe error state management
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { data } = await loginUser({ email, password });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setToken(data.token);
      setUser(data);
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid credentials or connection error.';
      setError(message);
      return false;
    }
  }, []);

  /**
   * Register new user with pending approval state management
   */
  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const { data } = await registerUser({ name, email, password });
      // If registration returns pending_approval status, return pending flag without logging in
      if (data.status === 'pending_approval' || !data.token) {
        return { success: true, pendingApproval: true, message: data.message };
      }
      // Direct login if admin approved or token returned
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setToken(data.token);
      setUser(data);
      return { success: true, pendingApproval: false };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed or email exists.';
      setError(message);
      return { success: false, message };
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (e) {}
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await getMyProfile();
      if (res?.data) {
        const stored = await AsyncStorage.getItem('user');
        const parsed = stored ? JSON.parse(stored) : {};
        const merged = { ...parsed, ...res.data };
        await AsyncStorage.setItem('user', JSON.stringify(merged));
        setUser(merged);
        return merged;
      }
    } catch (e) {
      console.log('Notice refreshing user:', e?.message);
    }
    return null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, refreshUser }}>
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
