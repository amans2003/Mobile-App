import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/**
 * ProfileScreen - User profile and theme settings with safe property handling and modern SafeAreaView
 */
const ProfileScreen = () => {
  const { user = {}, logout } = useAuth();
  const { theme, themeMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const formatRole = (roleStr) => {
    if (!roleStr || typeof roleStr !== 'string') return 'User';
    return roleStr.charAt(0).toUpperCase() + roleStr.slice(1);
  };

  const userInitial = user?.name && typeof user.name === 'string'
    ? user.name.charAt(0).toUpperCase()
    : 'U';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Profile & Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <View style={[styles.avatarSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.name || 'Guest User'}</Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user?.email || 'No email associated'}</Text>
        </View>

        {/* Preferences Section */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>PREFERENCES</Text>
        <View style={[styles.cardContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: theme.primaryLight }]}>
              <Ionicons
                name={themeMode === 'dark' ? 'moon' : 'sunny'}
                size={22}
                color={themeMode === 'dark' ? '#FBBF24' : '#F59E0B'}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoValue, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
                {themeMode === 'dark' ? 'Dark appearance active' : 'Light appearance active'}
              </Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Account Info Cards */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ACCOUNT INFORMATION</Text>
        <View style={[styles.cardContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Name Card */}
          <View style={[styles.infoCard, styles.borderBottom, { borderBottomColor: theme.border }]}>
            <View style={[styles.infoIcon, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="person-outline" size={20} color={theme.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Full Name</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{user?.name || 'N/A'}</Text>
            </View>
          </View>

          {/* Email Card */}
          <View style={[styles.infoCard, styles.borderBottom, { borderBottomColor: theme.border }]}>
            <View style={[styles.infoIcon, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="mail-outline" size={20} color={theme.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Email Address</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{user?.email || 'N/A'}</Text>
            </View>
          </View>

          {/* Role Card */}
          <View style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Account Type</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{formatRole(user?.role)}</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.errorBg, borderColor: themeMode === 'dark' ? '#7F1D1D' : '#FECACA' }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.errorText} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: theme.errorText }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    marginBottom: 20,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 8,
  },
  cardContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  infoCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
