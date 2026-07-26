import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMyTodayAttendance, getAnnouncements, getMyLeaves } from '../services/api';

/**
 * Safe time formatters
 */
const safeFormatTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return '';
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return '';
  }
};

const safeShortDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch (e) {
    return '';
  }
};

/**
 * HomeScreen — Employee Dashboard
 * Quick status, attendance widget, announcements feed, and pending leave summary
 */
const HomeScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      if (refreshUser) refreshUser().catch(() => {});
      const [attRes, annRes, leaveRes] = await Promise.all([
        getMyTodayAttendance().catch(() => ({ data: null })),
        getAnnouncements().catch(() => ({ data: [] })),
        getMyLeaves().catch(() => ({ data: [] })),
      ]);
      setTodayAttendance(attRes?.data || null);
      setAnnouncements(annRes?.data?.slice(0, 5) || []);
      setPendingLeaves(leaveRes?.data?.filter(l => l.status === 'pending').length || 0);
    } catch (error) {
      console.log('Dashboard fallback load:', error?.message);
    }
  }, [refreshUser]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const isCheckedIn = !!todayAttendance?.checkIn?.time;
  const isCheckedOut = !!todayAttendance?.checkOut?.time;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    greeting: { fontSize: 14, color: theme.textSecondary },
    name: { fontSize: 26, fontWeight: '800', color: theme.text, marginTop: 4 },
    role: { fontSize: 12, color: theme.primary, fontWeight: '600', marginTop: 4, textTransform: 'capitalize' },
    section: { paddingHorizontal: 20, marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12 },
    card: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    actionBtn: { flex: 1, minWidth: '45%', backgroundColor: theme.surface, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
    actionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    actionLabel: { fontSize: 12, fontWeight: '600', color: theme.text, textAlign: 'center' },
    attendanceCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border, marginBottom: 20, marginHorizontal: 20 },
    attendanceStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusText: { fontSize: 14, fontWeight: '600' },
    timeText: { fontSize: 12, color: theme.textSecondary },
    announcementCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 10 },
    annTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
    annContent: { fontSize: 12, color: theme.textSecondary, marginTop: 4, lineHeight: 18 },
    annMeta: { fontSize: 10, color: theme.textMuted, marginTop: 6 },
    badge: { backgroundColor: theme.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting()} 👋</Text>
        <Text style={styles.name}>{user?.name || 'Employee'}</Text>
        <Text style={styles.role}>{user?.designation || user?.role?.replace('_', ' ') || 'Team Member'}</Text>
      </View>

      {/* Attendance Status Card */}
      <View style={styles.attendanceCard}>
        <View style={styles.attendanceStatus}>
          <View style={[styles.statusDot, { backgroundColor: isCheckedIn ? (isCheckedOut ? '#6366f1' : '#10b981') : '#ef4444' }]} />
          <Text style={[styles.statusText, { color: isCheckedIn ? (isCheckedOut ? '#6366f1' : '#10b981') : '#ef4444' }]}>
            {isCheckedOut ? 'Day Complete' : isCheckedIn ? 'Checked In' : 'Not Checked In'}
          </Text>
        </View>
        {isCheckedIn && (
          <Text style={styles.timeText}>
            Check-in: {safeFormatTime(todayAttendance?.checkIn?.time)}
            {isCheckedOut && ` · Check-out: ${safeFormatTime(todayAttendance?.checkOut?.time)}`}
            {todayAttendance?.workHours > 0 && ` · ${todayAttendance.workHours}h worked`}
          </Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Attendance')}>
            <View style={[styles.actionIcon, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="finger-print" size={22} color="#10b981" />
            </View>
            <Text style={styles.actionLabel}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Time Off')}>
            <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="calendar" size={22} color="#f59e0b" />
            </View>
            <Text style={styles.actionLabel}>Time Off</Text>
            {pendingLeaves > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{pendingLeaves}</Text></View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Salary')}>
            <View style={[styles.actionIcon, { backgroundColor: '#ede9fe' }]}>
              <Ionicons name="wallet" size={22} color="#8b5cf6" />
            </View>
            <Text style={styles.actionLabel}>Salary</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Meetings')}>
            <View style={[styles.actionIcon, { backgroundColor: '#fce7f3' }]}>
              <Ionicons name="people" size={22} color="#ec4899" />
            </View>
            <Text style={styles.actionLabel}>Meetings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Expenses')}>
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="receipt" size={22} color="#3b82f6" />
            </View>
            <Text style={styles.actionLabel}>Expenses</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Profile')}>
            <View style={[styles.actionIcon, { backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="id-card" size={22} color="#64748b" />
            </View>
            <Text style={styles.actionLabel}>My Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Announcements Feed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Feed</Text>
        {announcements.length === 0 ? (
          <View style={styles.card}>
            <Text style={{ color: theme.textMuted, textAlign: 'center', fontSize: 13 }}>No announcements yet</Text>
          </View>
        ) : (
          announcements.map((ann, idx) => (
            <View key={ann._id || idx} style={styles.announcementCard}>
              <Text style={styles.annTitle}>{ann.title}</Text>
              <Text style={styles.annContent} numberOfLines={3}>{ann.content}</Text>
              <Text style={styles.annMeta}>
                {ann.author?.name || 'HR Team'} · {safeShortDate(ann.publishDate)}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default HomeScreen;
