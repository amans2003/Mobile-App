import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * SplashScreen - Entry screen introducing ShopLite with icons and theme toggle
 */
const SplashScreen = ({ navigation }) => {
  const { theme, themeMode, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top right theme toggle */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.themeBtn, { backgroundColor: theme.primaryLight }]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Ionicons
            name={themeMode === 'dark' ? 'sunny' : 'moon'}
            size={22}
            color={themeMode === 'dark' ? '#FBBF24' : theme.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Brand Logo / Icon */}
        <View style={[styles.logoContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.logoIconBg, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="bag-handle" size={54} color={theme.primary} />
          </View>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          <Text style={styles.titleHighlight}>Shop</Text>Lite
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your premium destination for modern online shopping. Clean, fast, and secure.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.loginBtn, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.loginText}>Log In</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.registerBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.8}
        >
          <Text style={[styles.registerText, { color: theme.text }]}>Create an Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  themeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  logoIconBg: {
    width: 86,
    height: 86,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: -1,
  },
  titleHighlight: {
    color: '#2563EB',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  loginBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  registerBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SplashScreen;
