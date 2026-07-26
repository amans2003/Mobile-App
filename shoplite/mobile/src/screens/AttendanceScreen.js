import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { checkIn, checkOut, getMyTodayAttendance, getMyAttendanceHistory } from '../services/api';

/**
 * Safe date formatters that work across all Android & iOS devices without throwing locale exceptions
 */
const safeFormatTime = (timeStr) => {
  if (!timeStr) return '—';
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return '—';
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return '—';
  }
};

const safeFormatDate = (dateVal) => {
  try {
    const d = dateVal ? new Date(dateVal) : new Date();
    if (isNaN(d.getTime())) return String(dateVal || 'Today');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return 'Today';
  }
};

const safeShortDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch (e) {
    return String(dateStr);
  }
};

/**
 * AttendanceScreen — GPS Check-In / Check-Out
 * Displays today's status, allows one-tap check-in/out, and shows recent history
 */
const AttendanceScreen = () => {
  const { theme } = useTheme();
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [todayRes, historyRes] = await Promise.all([
        getMyTodayAttendance().catch(() => ({ data: null })),
        getMyAttendanceHistory().catch(() => ({ data: [] })),
      ]);
      setToday(todayRes?.data || null);
      setHistory(historyRes?.data || []);
    } catch (error) {
      // Avoid console.error to prevent Expo Go Red Box
      console.log('Attendance load notice:', error?.message);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      await checkIn({ latitude: null, longitude: null });
      Alert.alert('✅ Checked In', 'Your attendance has been recorded.');
      loadData();
    } catch (error) {
      Alert.alert('Notice', error.response?.data?.message || 'Unable to record check in. Check your server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      await checkOut({ latitude: null, longitude: null });
      Alert.alert('✅ Checked Out', 'Your work hours have been recorded.');
      loadData();
    } catch (error) {
      Alert.alert('Notice', error.response?.data?.message || 'Unable to record check out. Check your server connection.');
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = !!today?.checkIn?.time;
  const isCheckedOut = !!today?.checkOut?.time;

  const statusColors = {
    present: '#10b981', late: '#f59e0b', absent: '#ef4444',
    half_day: '#f97316', on_leave: '#3b82f6',
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
    title: { fontSize: 24, fontWeight: '800', color: theme.text },
    subtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
    statusCard: { marginHorizontal: 20, backgroundColor: theme.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: theme.border, alignItems: 'center', marginBottom: 20 },
    statusIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    statusLabel: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    timeLabel: { fontSize: 13, color: theme.textSecondary, textAlign: 'center' },
    actionBtn: { marginTop: 20, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    section: { paddingHorizontal: 20, marginTop: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12 },
    historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 8 },
    historyDate: { fontSize: 13, fontWeight: '600', color: theme.text },
    historyTime: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },
    historyHours: { fontSize: 14, fontWeight: '700', color: theme.primary },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.subtitle}>{safeFormatDate(new Date())}</Text>
      </View>

      {/* Today's Status */}
      <View style={styles.statusCard}>
        <View style={[styles.statusIcon, {
          backgroundColor: isCheckedOut ? '#ede9fe' : isCheckedIn ? '#ecfdf5' : '#fef2f2'
        }]}>
          <Ionicons
            name={isCheckedOut ? 'checkmark-done-circle' : isCheckedIn ? 'checkmark-circle' : 'time'}
            size={40}
            color={isCheckedOut ? '#8b5cf6' : isCheckedIn ? '#10b981' : '#ef4444'}
          />
        </View>
        <Text style={[styles.statusLabel, { color: isCheckedOut ? '#8b5cf6' : isCheckedIn ? '#10b981' : '#ef4444' }]}>
          {isCheckedOut ? 'Day Complete' : isCheckedIn ? 'Currently Working' : 'Not Checked In'}
        </Text>
        {isCheckedIn && (
          <Text style={styles.timeLabel}>
            Check-in: {safeFormatTime(today?.checkIn?.time)}
            {isCheckedOut && `\nCheck-out: ${safeFormatTime(today?.checkOut?.time)}`}
            {today?.workHours > 0 && `\n${today.workHours} hours worked`}
          </Text>
        )}

        {!isCheckedIn && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
            onPress={handleCheckIn}
            disabled={loading}
          >
            <Text style={styles.actionBtnText}>{loading ? 'Processing...' : '📍 Check In'}</Text>
          </TouchableOpacity>
        )}
        {isCheckedIn && !isCheckedOut && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
            onPress={handleCheckOut}
            disabled={loading}
          >
            <Text style={styles.actionBtnText}>{loading ? 'Processing...' : '🏠 Check Out'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent History</Text>
        {history.map((record, index) => (
          <View key={record._id || index} style={styles.historyItem}>
            <View>
              <Text style={styles.historyDate}>
                {safeShortDate(record.date)}
              </Text>
              <Text style={styles.historyTime}>
                {safeFormatTime(record.checkIn?.time)} {' → '} {safeFormatTime(record.checkOut?.time)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={styles.historyHours}>{record.workHours ? `${record.workHours}h` : '—'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[record.status] || '#9ca3af' }]}>
                <Text style={styles.statusBadgeText}>{record.status?.replace('_', ' ').toUpperCase() || 'LOGGED'}</Text>
              </View>
            </View>
          </View>
        ))}
        {history.length === 0 && (
          <View style={[styles.historyItem, { justifyContent: 'center', paddingVertical: 20 }]}>
            <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>No attendance history yet. Pull down to refresh.</Text>
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

export default AttendanceScreen;
