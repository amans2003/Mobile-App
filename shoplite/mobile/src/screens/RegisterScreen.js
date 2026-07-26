import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CustomInput from '../components/CustomInput';

/**
 * RegisterScreen - Employee onboarding registration form
 */
const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, error: authError } = useAuth();
  const { theme } = useTheme();

  const validate = () => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');

    if (!name.trim()) {
      setNameError('Full name is required');
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError('Company email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    const result = await register(name, email, password);
    setIsSubmitting(false);

    if (result?.success && result?.pendingApproval) {
      Alert.alert(
        '🕒 Application Submitted',
        'Your employee account has been successfully submitted! An HR Manager or Super Admin must approve your registration in the admin dashboard before you can log in.',
        [{ text: 'Return to Login', onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="briefcase" size={30} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Employee Sign-Up</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Register your employee account for approval</Text>
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
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full legal name"
              error={nameError}
              autoCapitalize="words"
            />
            <CustomInput
              label="Company Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your corporate email"
              keyboardType="email-address"
              error={emailError}
            />
            <CustomInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a strong password (min 6 characters)"
              secureTextEntry
              error={passwordError}
            />

            <TouchableOpacity
              style={[
                styles.registerBtn,
                { backgroundColor: theme.primary },
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleRegister}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={styles.registerBtnText}>
                {isSubmitting ? 'Submitting Application...' : 'Submit Registration'}
              </Text>
            </TouchableOpacity>
            
            <View style={[styles.noticeBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
                Security Note: New registrations go to HR for verification before active access is granted.
              </Text>
            </View>
          </View>

          {/* Login Redirect */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already approved? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: theme.primary }]}>Log In</Text>
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 40 },
  header: { alignItems: 'flex-start', marginBottom: 28 },
  iconBox: { width: 58, height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 15 },
  errorContainer: { padding: 12, borderRadius: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center' },
  errorBannerText: { fontSize: 13, fontWeight: '600', flex: 1 },
  form: { marginBottom: 28 },
  registerBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  registerBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  noticeBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  noticeText: { fontSize: 12, flex: 1, lineHeight: 17 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '700' },
});

export default RegisterScreen;
