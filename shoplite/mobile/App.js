import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { ProductProvider } from './src/context/ProductContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * MainApp - Inner component consuming theme for status bar
 */
const MainApp = () => {
  const { theme, themeMode } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
      />
      <AppNavigator />
    </>
  );
};

/**
 * App - Root component for ShopLite Mobile
 * Wraps the app with ThemeProvider, AuthProvider, and ProductProvider contexts
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProductProvider>
          <MainApp />
        </ProductProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
