import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext();

/**
 * AuthProvider - Manages user authentication state and safe error handling for mobile app
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
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error loading auth data:', err);
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
   * Register new user with safe error state management
   */
  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const { data } = await registerUser({ name, email, password });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setToken(data.token);
      setUser(data);
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed or email exists.';
      setError(message);
      return false;
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

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout }}>
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
