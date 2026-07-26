import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/**
 * ProfileScreen — Employee profile, settings, and sign-out
 */
const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme, themeMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
  };

  const infoRows = [
    { icon: 'mail-outline', label: 'Email', value: user?.email },
    { icon: 'call-outline', label: 'Phone', value: user?.phone || 'Not set' },
    { icon: 'business-outline', label: 'Department', value: user?.department || 'Unassigned' },
    { icon: 'briefcase-outline', label: 'Designation', value: user?.designation || 'Employee' },
    { icon: 'card-outline', label: 'Employee ID', value: user?.employeeId || '—' },
    { icon: 'shield-checkmark-outline', label: 'Role', value: user?.role?.replace('_', ' ') || 'employee' },
  ];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { alignItems: 'center', paddingTop: 70, paddingBottom: 24 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
    name: { fontSize: 22, fontWeight: '800', color: theme.text },
    role: { fontSize: 13, color: theme.textSecondary, marginTop: 4, textTransform: 'capitalize' },
    section: { paddingHorizontal: 20, marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    card: { backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
    rowLast: { borderBottomWidth: 0 },
    rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rowLabel: { fontSize: 12, color: theme.textSecondary },
    rowValue: { fontSize: 14, fontWeight: '600', color: theme.text, marginTop: 2 },
    themeToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
    themeLabel: { fontSize: 14, fontWeight: '600', color: theme.text },
    logoutBtn: { backgroundColor: '#ef4444', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 10, marginBottom: 40 },
    logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'E'}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Employee'}</Text>
        <Text style={styles.role}>{user?.designation || user?.role?.replace('_', ' ')}</Text>
      </View>

      {/* Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.card}>
          {infoRows.map((row, idx) => (
            <View key={row.label} style={[styles.row, idx === infoRows.length - 1 && styles.rowLast]}>
              <View style={styles.rowIcon}>
                <Ionicons name={row.icon} size={18} color={theme.primary} />
              </View>
              <View>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <Text style={styles.themeLabel}>Dark Mode</Text>
          <Ionicons name={themeMode === 'dark' ? 'moon' : 'sunny-outline'} size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default ProfileScreen;
