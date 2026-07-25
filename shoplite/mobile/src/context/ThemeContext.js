import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const themes = {
  light: {
    mode: 'light',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    primaryText: '#FFFFFF',
    inputBg: '#F9FAFB',
    errorBg: '#FEF2F2',
    errorText: '#EF4444',
    successBg: '#ECFDF5',
    successText: '#059669',
    iconSecondary: '#6B7280',
    headerBg: '#FFFFFF',
    headerText: '#1F2937',
  },
  dark: {
    mode: 'dark',
    background: '#0F172A',
    surface: '#1E293B',
    card: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    border: '#334155',
    primary: '#3B82F6',
    primaryLight: '#1E3A8A',
    primaryText: '#FFFFFF',
    inputBg: '#0F172A',
    errorBg: '#450A0A',
    errorText: '#F87171',
    successBg: '#064E3B',
    successText: '#34D399',
    iconSecondary: '#94A3B8',
    headerBg: '#1E293B',
    headerText: '#F8FAFC',
  },
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(systemColorScheme || 'light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('user_theme_preference');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    try {
      await AsyncStorage.setItem('user_theme_preference', newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const theme = themes[themeMode] || themes.light;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
