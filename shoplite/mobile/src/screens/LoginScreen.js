import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CustomInput from '../components/CustomInput';

/**
 * LoginScreen - Employee Portal Authentication
 */
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, error: authError } = useAuth();
  const { theme } = useTheme();

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Company email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    await login(email, password);
    setIsSubmitting(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Icon & Text */}
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="lock-closed" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Employee Login</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign in to access attendance, leaves, & payslips</Text>
          </View>

          {/* Error Banner */}
          {authError ? (
            <View style={[styles.errorContainer, { backgroundColor: theme.errorBg }]}>
              <Ionicons name="alert-circle" size={18} color={theme.errorText} style={{ marginRight: 8 }} />
              <Text style={[styles.errorBannerText, { color: theme.errorText }]}>{authError}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.form}>
            <CustomInput
              label="Company Email"
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. vikram@company.com"
              keyboardType="email-address"
              error={emailError}
            />
            <CustomInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              error={passwordError}
            />

            <TouchableOpacity
              style={[
                styles.loginBtn,
                { backgroundColor: theme.primary },
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleLogin}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>
                {isSubmitting ? 'Verifying...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Quick Demo Credentials box */}
            <View style={[styles.demoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.demoText, { color: theme.textSecondary }]}>
                Demo Employee: <Text style={{ fontWeight: '700', color: theme.text }}>vikram@company.com</Text> / <Text style={{ fontWeight: '700', color: theme.text }}>password123</Text>
              </Text>
            </View>
          </View>

          {/* Register Redirect */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>New team member? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: theme.primary }]}>Register Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 40 },
  header: { alignItems: 'flex-start', marginBottom: 28 },
  iconBox: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 15 },
  errorContainer: { padding: 12, borderRadius: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center' },
  errorBannerText: { fontSize: 13, fontWeight: '600', flex: 1 },
  form: { marginBottom: 28 },
  loginBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  demoBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 24 },
  demoText: { fontSize: 13, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: '700' },
});

export default LoginScreen;
