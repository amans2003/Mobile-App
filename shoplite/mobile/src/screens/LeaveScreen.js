import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { applyLeave, getMyLeaves, cancelLeave } from '../services/api';

/**
 * Safe date formatting without crashing on Android
 */
const safeShortDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return String(dateStr);
  }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * LeaveScreen — Apply for leave with interactive Calendar picker, view balances, and track request status
 */
const LeaveScreen = () => {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ leaveType: 'pto', startDate: '', endDate: '', reason: '' });

  // ── Calendar Modal State ─────────────────────────────────────
  const [pickerMode, setPickerMode] = useState(null); // 'start' | 'end' | null
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const loadLeaves = useCallback(async () => {
    try {
      if (refreshUser) refreshUser().catch(() => {});
      const res = await getMyLeaves();
      setLeaves(res?.data || []);
    } catch (error) {
      console.log('Load leaves notice:', error?.message);
    }
  }, [refreshUser]);

  useFocusEffect(
    useCallback(() => {
      loadLeaves();
    }, [loadLeaves])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLeaves();
    setRefreshing(false);
  }, [loadLeaves]);

  // Open calendar for specific input
  const openCalendar = (mode) => {
    const existingStr = mode === 'start' ? form.startDate : (form.endDate || form.startDate);
    if (existingStr) {
      const parts = existingStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
          setViewYear(y);
          setViewMonth(m);
        }
      }
    } else {
      const now = new Date();
      setViewMonth(now.getMonth());
      setViewYear(now.getFullYear());
    }
    setPickerMode(mode);
  };

  // Generate matrix of days for selected month and year
  const getCalendarDays = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const grid = [];
    // Fill initial blanks
    for (let i = 0; i < firstDay; i++) {
      grid.push(null);
    }
    // Fill valid days
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push(i);
    }
    return grid;
  };

  const handleSelectDate = (day) => {
    if (!day) return;
    const formattedDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (pickerMode === 'start') {
      let newEnd = form.endDate;
      // If end date is earlier than new start date, adjust end date to equal start date
      if (newEnd && newEnd < formattedDate) {
        newEnd = formattedDate;
      }
      setForm({ ...form, startDate: formattedDate, endDate: newEnd || formattedDate });
    } else if (pickerMode === 'end') {
      if (form.startDate && formattedDate < form.startDate) {
        Alert.alert('Invalid Range', 'End Date cannot be earlier than Start Date.');
        return;
      }
      setForm({ ...form, endDate: formattedDate, startDate: form.startDate || formattedDate });
    }
    setPickerMode(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  // Compute requested days count
  const getDaysCount = () => {
    if (!form.startDate || !form.endDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (isNaN(start) || isNaN(end) || end < start) return 1;
    return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      Alert.alert('Missing Details', 'Please select both start and end dates and provide a valid reason.');
      return;
    }
    try {
      setSubmitting(true);
      await applyLeave({ ...form, totalDays: getDaysCount() });
      Alert.alert('✅ Request Submitted', `Your request for ${getDaysCount()} day(s) of leave has been submitted for review.`);
      setShowForm(false);
      setForm({ leaveType: 'pto', startDate: '', endDate: '', reason: '' });
      loadLeaves();
    } catch (error) {
      Alert.alert('Notice', error.response?.data?.message || 'Failed to submit request. Please check server connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    Alert.alert('Cancel Request', 'Are you sure you want to cancel and remove this leave request?', [
      { text: 'No' },
      { text: 'Yes', onPress: async () => {
        try {
          await cancelLeave(id);
          loadLeaves();
        } catch (error) {
          Alert.alert('Notice', error.response?.data?.message || 'Failed to cancel request.');
        }
      }},
    ]);
  };

  const balances = user?.leaveBalances || {};
  const ptoLeft = Number(balances.pto ?? 20);
  const sickLeft = Number(balances.sick ?? 10);
  const casualLeft = Number(balances.casual ?? 7);

  const ptoUsed = leaves.filter(l => l.status === 'approved' && (l.leaveType === 'pto' || l.leaveType === 'annual')).reduce((sum, l) => sum + (l.totalDays || 1), 0);
  const sickUsed = leaves.filter(l => l.status === 'approved' && l.leaveType === 'sick').reduce((sum, l) => sum + (l.totalDays || 1), 0);
  const casualUsed = leaves.filter(l => l.status === 'approved' && l.leaveType === 'casual').reduce((sum, l) => sum + (l.totalDays || 1), 0);

  const ptoTotal = ptoLeft + ptoUsed;
  const sickTotal = sickLeft + sickUsed;
  const casualTotal = casualLeft + casualUsed;

  const statusColors = {
    pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444', cancelled: '#9ca3af',
  };

  const leaveTypeLabels = {
    pto: 'Paid Time Off (PTO)', sick: 'Sick Leave', casual: 'Casual Leave', unpaid: 'Unpaid / Emergency',
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    title: { fontSize: 24, fontWeight: '800', color: theme.text },
    addBtn: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    balancesRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
    balanceCard: { flex: 1, backgroundColor: theme.surface, borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    balanceNum: { fontSize: 20, fontWeight: '900' },
    balanceLabel: { fontSize: 11, color: theme.text, marginTop: 3, fontWeight: '800', textAlign: 'center' },
    balanceSub: { fontSize: 9, color: theme.textSecondary, marginTop: 2, fontWeight: '600', textAlign: 'center' },
    section: { paddingHorizontal: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12 },
    leaveCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 10 },
    leaveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    leaveType: { fontSize: 13, fontWeight: '700', color: theme.text },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
    leaveDates: { fontSize: 12, color: theme.textSecondary, marginTop: 6, fontWeight: '600' },
    leaveReason: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
    cancelBtn: { marginTop: 8, alignSelf: 'flex-start' },
    cancelBtnText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
    formContainer: { marginHorizontal: 20, backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 20 },
    formSectionLabel: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 8, marginTop: 4 },
    typePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    typeBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
    typeBtnText: { fontSize: 12, fontWeight: '600' },
    datePickerRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    dateBox: { flex: 1, backgroundColor: theme.inputBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border },
    dateLabel: { fontSize: 11, color: theme.textMuted, fontWeight: '600', marginBottom: 3 },
    dateValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateValueText: { fontSize: 14, color: theme.text, fontWeight: '700' },
    placeholderText: { fontSize: 14, color: theme.textMuted, fontWeight: '500' },
    durationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primaryLight, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginBottom: 14 },
    durationText: { color: theme.primary, fontWeight: '700', fontSize: 13, marginLeft: 6 },
    input: { backgroundColor: theme.inputBg, borderRadius: 12, padding: 12, fontSize: 14, color: theme.text, borderWidth: 1, borderColor: theme.border, marginBottom: 12, height: 85, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    
    // Modal Calendar styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalContent: { w: '100%', maxWidth: 360, backgroundColor: theme.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10, width: '100%' },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
    monthTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    navBtn: { padding: 8, borderRadius: 10, backgroundColor: theme.inputBg },
    weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 6 },
    weekDayText: { width: 40, textAlign: 'center', fontSize: 12, fontWeight: '700', color: theme.textSecondary },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 2 },
    dayButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    dayText: { fontSize: 14, fontWeight: '600', color: theme.text },
    selectedDayBtn: { backgroundColor: theme.primary },
    selectedDayText: { color: '#ffffff', fontWeight: '800' },
    closeModalBtn: { marginTop: 16, paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.border },
    closeModalText: { fontSize: 15, fontWeight: '700', color: theme.textSecondary },
  });

  const calendarDays = getCalendarDays();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Time Off</Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: '600', marginTop: 2 }}>
            Plan & track your leave quota
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtnText}>{showForm ? 'Close Form' : '+ Apply Leave'}</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Leave Balances (Assigned by Admin/HR vs Used) */}
      <View style={styles.balancesRow}>
        <View style={[styles.balanceCard, { borderTopWidth: 4, borderTopColor: '#10b981' }]}>
          <Text style={[styles.balanceNum, { color: '#10b981' }]}>{ptoLeft}</Text>
          <Text style={styles.balanceLabel}>🏖️ Paid Leave Left</Text>
          <Text style={styles.balanceSub}>{ptoUsed} used / {ptoTotal} total</Text>
        </View>
        <View style={[styles.balanceCard, { borderTopWidth: 4, borderTopColor: '#ef4444' }]}>
          <Text style={[styles.balanceNum, { color: '#ef4444' }]}>{sickLeft}</Text>
          <Text style={styles.balanceLabel}>🤒 Sick Leave Left</Text>
          <Text style={styles.balanceSub}>{sickUsed} used / {sickTotal} total</Text>
        </View>
        <View style={[styles.balanceCard, { borderTopWidth: 4, borderTopColor: '#3b82f6' }]}>
          <Text style={[styles.balanceNum, { color: '#3b82f6' }]}>{casualLeft}</Text>
          <Text style={styles.balanceLabel}>⚡ Casual Left</Text>
          <Text style={styles.balanceSub}>{casualUsed} used / {casualTotal} total</Text>
        </View>
      </View>

      {/* Apply Form */}
      {showForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formSectionLabel}>1. Select Leave Type</Text>
          <View style={styles.typePicker}>
            {['pto', 'sick', 'casual', 'unpaid'].map((type) => (
              <TouchableOpacity key={type}
                style={[styles.typeBtn, {
                  borderColor: form.leaveType === type ? theme.primary : theme.border,
                  backgroundColor: form.leaveType === type ? theme.primaryLight : 'transparent',
                }]}
                onPress={() => setForm({ ...form, leaveType: type })}>
                <Text style={[styles.typeBtnText, { color: form.leaveType === type ? theme.primary : theme.textSecondary }]}>
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formSectionLabel}>2. Select Dates via Calendar</Text>
          <View style={styles.datePickerRow}>
            {/* Start Date Selector */}
            <TouchableOpacity style={styles.dateBox} activeOpacity={0.8} onPress={() => openCalendar('start')}>
              <Text style={styles.dateLabel}>From (Start Date)</Text>
              <View style={styles.dateValueRow}>
                <Text style={form.startDate ? styles.dateValueText : styles.placeholderText}>
                  {safeShortDate(form.startDate) || 'Choose Date'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={theme.primary} />
              </View>
            </TouchableOpacity>

            {/* End Date Selector */}
            <TouchableOpacity style={styles.dateBox} activeOpacity={0.8} onPress={() => openCalendar('end')}>
              <Text style={styles.dateLabel}>To (End Date)</Text>
              <View style={styles.dateValueRow}>
                <Text style={form.endDate ? styles.dateValueText : styles.placeholderText}>
                  {safeShortDate(form.endDate) || 'Choose Date'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={theme.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Duration display */}
          {form.startDate && form.endDate ? (
            <View style={styles.durationBadge}>
              <Ionicons name="time" size={18} color={theme.primary} />
              <Text style={styles.durationText}>
                Total Leave Duration: {getDaysCount()} Day(s) ({leaveTypeLabels[form.leaveType] || form.leaveType})
              </Text>
            </View>
          ) : null}

          <Text style={styles.formSectionLabel}>3. Reason for Leave</Text>
          <TextInput
            style={styles.input}
            placeholder="State reason (e.g. Family function, doctor appointment...)"
            placeholderTextColor={theme.textMuted}
            multiline
            value={form.reason}
            onChangeText={(t) => setForm({ ...form, reason: t })}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? 'Submitting to HR...' : 'Submit Leave Request'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Leave History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Leave Applications</Text>
        {leaves.map((leave, idx) => (
          <View key={leave._id || idx} style={styles.leaveCard}>
            <View style={styles.leaveHeader}>
              <Text style={styles.leaveType}>{leaveTypeLabels[leave.leaveType]?.split(' ')[0] || leave.leaveType.toUpperCase()} · {leave.totalDays || 1} day(s)</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[leave.status] || '#f59e0b' }]}>
                <Text style={styles.statusText}>{leave.status || 'pending'}</Text>
              </View>
            </View>
            <Text style={styles.leaveDates}>
              📅 {safeShortDate(leave.startDate)}  ➔  {safeShortDate(leave.endDate)}
            </Text>
            <Text style={styles.leaveReason} numberOfLines={2}>{leave.reason}</Text>
            {leave.status === 'pending' && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(leave._id)}>
                <Text style={styles.cancelBtnText}>✕ Cancel Application</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {leaves.length === 0 && (
          <View style={[styles.leaveCard, { alignItems: 'center', paddingVertical: 24 }]}>
            <Ionicons name="calendar-clear-outline" size={32} color={theme.textMuted} style={{ marginBottom: 8 }} />
            <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '600' }}>No leave applications recorded yet.</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>Tap '+ Apply Leave' above to schedule time off.</Text>
          </View>
        )}
      </View>

      {/* ── INTERACTIVE CALENDAR MODAL ────────────────────────────────────── */}
      <Modal visible={pickerMode !== null} transparent animationType="fade" onRequestClose={() => setPickerMode(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header: Month Year and Navigation */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Week Days Header */}
            <View style={styles.weekRow}>
              {WEEK_DAYS.map((w, i) => (
                <Text key={i} style={styles.weekDayText}>{w}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <View key={`blank-${i}`} style={styles.dayCell} />;
                }
                const cellDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = (pickerMode === 'start' && form.startDate === cellDateStr) || (pickerMode === 'end' && form.endDate === cellDateStr);
                const isToday = new Date().toISOString().slice(0, 10) === cellDateStr;

                return (
                  <View key={`day-${day}`} style={styles.dayCell}>
                    <TouchableOpacity
                      style={[
                        styles.dayButton,
                        isSelected && styles.selectedDayBtn,
                        !isSelected && isToday && { borderWidth: 1.5, borderColor: theme.primary },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleSelectDate(day)}
                    >
                      <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Close Modal Button */}
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setPickerMode(null)}>
              <Text style={styles.closeModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

export default LeaveScreen;
