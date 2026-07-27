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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createMeeting, updateMeeting, getMyMeetings, rsvpMeeting, fetchEmployees } from '../services/api';

/**
 * Safe date/time formatting helper for displaying lists
 */
const safeFormatDateTime = (timeStr) => {
  if (!timeStr) return '—';
  try {
    const d = new Date(timeStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return String(timeStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${d.getDate()} ${months[d.getMonth()]} · ${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return String(timeStr);
  }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const QUICK_TIMES = [
  { label: '09:30 AM', hour: 9, min: '30', ampm: 'AM' },
  { label: '10:00 AM', hour: 10, min: '00', ampm: 'AM' },
  { label: '11:30 AM', hour: 11, min: '30', ampm: 'AM' },
  { label: '02:00 PM', hour: 2, min: '00', ampm: 'PM' },
  { label: '03:30 PM', hour: 3, min: '30', ampm: 'PM' },
  { label: '04:30 PM', hour: 4, min: '30', ampm: 'PM' },
];

/**
 * MeetingsScreen — Schedule meetings with an interactive Calendar Date & Time picker
 */
const MeetingsScreen = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [editingMeetingId, setEditingMeetingId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', startTime: '', endTime: '', meetingLink: '' });

  // ── Calendar & Time Picker Modal State ──────────────────────────────
  const [pickerMode, setPickerMode] = useState(null); // 'start' | 'end' | null
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedAmPm, setSelectedAmPm] = useState('AM');

  const loadData = useCallback(async () => {
    try {
      const [meetRes, empRes] = await Promise.all([
        getMyMeetings().catch(() => ({ data: [] })),
        fetchEmployees().catch(() => ({ data: [] })),
      ]);
      setMeetings(meetRes?.data || []);
      setEmployees(empRes?.data || []);
    } catch (error) {
      console.log('Load meetings notice:', error?.message);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Open Calendar + Time modal for start or end time
  const openDateTimePicker = (mode) => {
    const targetStr = mode === 'start' ? form.startTime : (form.endTime || form.startTime);
    if (targetStr && targetStr.includes(' ')) {
      const [datePart, timePart] = targetStr.split(' ');
      const [y, m, d] = datePart.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        setViewYear(y);
        setViewMonth(m - 1);
        setSelectedDay(d);
      }
      if (timePart) {
        const [hh, mm] = timePart.split(':').map(Number);
        if (!isNaN(hh)) {
          setSelectedAmPm(hh >= 12 ? 'PM' : 'AM');
          let h12 = hh % 12 || 12;
          setSelectedHour(h12);
          setSelectedMinute(String(mm || 0).padStart(2, '0'));
        }
      }
    } else {
      const now = new Date();
      setViewMonth(now.getMonth());
      setViewYear(now.getFullYear());
      setSelectedDay(now.getDate());
      if (mode === 'end') {
        setSelectedHour(11);
        setSelectedMinute('00');
        setSelectedAmPm('AM');
      } else {
        setSelectedHour(10);
        setSelectedMinute('00');
        setSelectedAmPm('AM');
      }
    }
    setPickerMode(mode);
  };

  const getCalendarDays = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const grid = [];
    for (let i = 0; i < firstDay; i++) {
      grid.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push(i);
    }
    return grid;
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else { setViewMonth(viewMonth + 1); }
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else { setViewMonth(viewMonth - 1); }
  };

  const confirmDateTime = () => {
    let h24 = selectedHour;
    if (selectedAmPm === 'PM' && selectedHour < 12) h24 += 12;
    if (selectedAmPm === 'AM' && selectedHour === 12) h24 = 0;

    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')} ${String(h24).padStart(2, '0')}:${selectedMinute}`;

    if (pickerMode === 'start') {
      let newEnd = form.endTime;
      // If end time is missing or earlier, automatically default end time to 1 hour later!
      if (!newEnd || newEnd <= formatted) {
        let endH24 = (h24 + 1) % 24;
        newEnd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')} ${String(endH24).padStart(2, '0')}:${selectedMinute}`;
      }
      setForm({ ...form, startTime: formatted, endTime: newEnd });
    } else {
      if (form.startTime && formatted <= form.startTime) {
        Alert.alert('Invalid Range', 'Meeting end time must be after the start time.');
        return;
      }
      setForm({ ...form, endTime: formatted, startTime: form.startTime || formatted });
    }
    setPickerMode(null);
  };

  const getDurationString = () => {
    if (!form.startTime || !form.endTime) return null;
    const start = new Date(form.startTime.replace(' ', 'T'));
    const end = new Date(form.endTime.replace(' ', 'T'));
    if (isNaN(start) || isNaN(end) || end <= start) return 'Invalid timing';
    const diffMins = Math.round((end - start) / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0 && mins > 0) return `${hours} hr ${mins} mins`;
    if (hours > 0) return `${hours} hr(s)`;
    return `${mins} mins`;
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.startTime || !form.endTime) {
      Alert.alert('Incomplete Schedule', 'Please provide a meeting title and pick both start and end times from the calendar.');
      return;
    }
    if (selectedAttendees.length === 0) {
      Alert.alert('No Attendees', 'Please select at least one staff member to invite to this meeting.');
      return;
    }
    try {
      setSubmitting(true);
      if (editingMeetingId) {
        await updateMeeting(editingMeetingId, { ...form, attendees: selectedAttendees });
        Alert.alert('✅ Meeting Updated', `Successfully updated "${form.title}".`);
      } else {
        await createMeeting({ ...form, attendees: selectedAttendees });
        Alert.alert('✅ Meeting Scheduled', `Successfully scheduled "${form.title}" and notified invited employees.`);
      }
      setShowForm(false);
      setEditingMeetingId(null);
      setForm({ title: '', description: '', startTime: '', endTime: '', meetingLink: '' });
      setSelectedAttendees([]);
      loadData();
    } catch (error) {
      Alert.alert('Notice', error.response?.data?.message || 'Failed to save meeting. Check network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeetingId(meeting._id);
    setForm({
      title: meeting.title || '',
      description: meeting.description || '',
      meetingLink: meeting.meetingLink || '',
      startTime: meeting.startTime ? safeFormatDateTime(meeting.startTime) : '',
      endTime: meeting.endTime ? safeFormatDateTime(meeting.endTime) : '',
    });

    const attendeeIds = meeting.attendees?.map((a) => String(a.user?._id || a.user || a._id)).filter(Boolean) || [];
    setSelectedAttendees(attendeeIds);
    setShowForm(true);
  };

  const handleRsvp = async (meetingId, status) => {
    try {
      await rsvpMeeting(meetingId, { status });
      loadData();
    } catch (error) {
      Alert.alert('Notice', error.response?.data?.message || 'Failed to update RSVP.');
    }
  };

  const toggleAttendee = (id) => {
    setSelectedAttendees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    title: { fontSize: 24, fontWeight: '800', color: theme.text },
    addBtn: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    section: { paddingHorizontal: 20 },
    formContainer: { marginHorizontal: 20, backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 20 },
    formSectionLabel: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 8, marginTop: 6 },
    input: { backgroundColor: theme.inputBg, borderRadius: 12, padding: 12, fontSize: 14, color: theme.text, borderWidth: 1, borderColor: theme.border, marginBottom: 10 },
    
    // Date & Time Picker UI Box
    datePickerRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    dateBox: { flex: 1, backgroundColor: theme.inputBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border },
    dateLabel: { fontSize: 11, color: theme.textMuted, fontWeight: '600', marginBottom: 4 },
    dateValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateValueText: { fontSize: 13, color: theme.text, fontWeight: '700' },
    placeholderText: { fontSize: 13, color: theme.textMuted, fontWeight: '500' },
    durationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primaryLight, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginBottom: 14 },
    durationText: { color: theme.primary, fontWeight: '700', fontSize: 13, marginLeft: 6 },

    attendeeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginRight: 8, marginBottom: 8 },
    attendeeChipText: { fontSize: 12, fontWeight: '600' },
    submitBtn: { backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    
    meetingCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
    meetingTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
    meetingTime: { fontSize: 13, color: theme.primary, fontWeight: '600', marginTop: 4 },
    meetingOrg: { fontSize: 12, color: theme.textSecondary, marginTop: 4 },
    attendeesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    attendeeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: theme.primaryLight },
    attendeeBadgeText: { fontSize: 11, fontWeight: '600', color: theme.primary },
    rsvpRow: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border },
    rsvpBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
    rsvpBtnText: { fontWeight: '700', fontSize: 12 },
    organizerBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingTop: 10, borderTopWidth: 1 },
    organizerBannerText: { fontSize: 12, fontWeight: '700' },

    // Calendar Modal UI
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: theme.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12, width: '100%', maxWidth: 380 },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
    monthTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
    navBtn: { padding: 8, borderRadius: 10, backgroundColor: theme.inputBg },
    weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 6 },
    weekDayText: { width: 38, textAlign: 'center', fontSize: 11, fontWeight: '700', color: theme.textSecondary },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
    dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 1 },
    dayButton: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
    dayText: { fontSize: 13, fontWeight: '600', color: theme.text },
    selectedDayBtn: { backgroundColor: theme.primary },
    selectedDayText: { color: '#ffffff', fontWeight: '800' },

    // Time picker section inside modal
    timePickerBox: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 },
    timeSectionTitle: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 8 },
    quickTimesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    quickTimeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
    quickTimeText: { fontSize: 11, fontWeight: '700' },
    timeScrollers: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 },
    timeAdjuster: { alignItems: 'center', backgroundColor: theme.inputBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
    timeAdjusterText: { fontSize: 18, fontWeight: '800', color: theme.text, my: 4 },
    timeArrowBtn: { padding: 4 },
    colonText: { fontSize: 22, fontWeight: '800', color: theme.textMuted },
    
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
    cancelModalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border },
    cancelModalText: { fontSize: 14, fontWeight: '700', color: theme.textSecondary },
    confirmModalBtn: { flex: 2, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: theme.primary },
    confirmModalText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  });

  const calendarDays = getCalendarDays();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Company Meetings</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtnText}>{showForm ? 'Close Form' : '+ Schedule'}</Text>
        </TouchableOpacity>
      </View>

      {/* Schedule Form */}
      {showForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formSectionLabel}>1. Meeting Details</Text>
          <TextInput style={styles.input} placeholder="Meeting Title (e.g. Quarterly Review)" placeholderTextColor={theme.textMuted}
            value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />
          <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Agenda / Description (optional)"
            placeholderTextColor={theme.textMuted} multiline value={form.description}
            onChangeText={(t) => setForm({ ...form, description: t })} />
          <TextInput style={styles.input} placeholder="Virtual Meeting Link (e.g. Google Meet / Zoom URL)" placeholderTextColor={theme.textMuted}
            value={form.meetingLink} onChangeText={(t) => setForm({ ...form, meetingLink: t })} />

          <Text style={styles.formSectionLabel}>2. Date & Time Schedule (Tap Calendar)</Text>
          <View style={styles.datePickerRow}>
            {/* Start DateTime Box */}
            <TouchableOpacity style={styles.dateBox} activeOpacity={0.8} onPress={() => openDateTimePicker('start')}>
              <Text style={styles.dateLabel}>Start Date & Time</Text>
              <View style={styles.dateValueRow}>
                <Text style={form.startTime ? styles.dateValueText : styles.placeholderText} numberOfLines={1}>
                  {form.startTime ? safeFormatDateTime(form.startTime) : 'Select Start'}
                </Text>
                <Ionicons name="calendar" size={16} color={theme.primary} />
              </View>
            </TouchableOpacity>

            {/* End DateTime Box */}
            <TouchableOpacity style={styles.dateBox} activeOpacity={0.8} onPress={() => openDateTimePicker('end')}>
              <Text style={styles.dateLabel}>End Date & Time</Text>
              <View style={styles.dateValueRow}>
                <Text style={form.endTime ? styles.dateValueText : styles.placeholderText} numberOfLines={1}>
                  {form.endTime ? safeFormatDateTime(form.endTime) : 'Select End'}
                </Text>
                <Ionicons name="calendar" size={16} color={theme.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Duration info badge */}
          {form.startTime && form.endTime ? (
            <View style={styles.durationBadge}>
              <Ionicons name="time" size={18} color={theme.primary} />
              <Text style={styles.durationText}>
                Scheduled Duration: {getDurationString()}
              </Text>
            </View>
          ) : null}

          <Text style={styles.formSectionLabel}>3. Invite Staff & Attendees ({selectedAttendees.length} selected)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
            {employees.filter((emp) => String(emp._id) !== String(user?._id) && emp.email !== user?.email).map((emp) => (
              <TouchableOpacity key={emp._id}
                style={[styles.attendeeChip, {
                  borderColor: selectedAttendees.includes(emp._id) ? theme.primary : theme.border,
                  backgroundColor: selectedAttendees.includes(emp._id) ? theme.primaryLight : 'transparent',
                }]}
                onPress={() => toggleAttendee(emp._id)}>
                <Text style={[styles.attendeeChipText, {
                  color: selectedAttendees.includes(emp._id) ? theme.primary : theme.textSecondary,
                }]}>
                  {selectedAttendees.includes(emp._id) ? '✓ ' : '+ '}{emp.name}
                </Text>
              </TouchableOpacity>
            ))}
            {employees.filter((emp) => String(emp._id) !== String(user?._id) && emp.email !== user?.email).length === 0 && (
              <Text style={{ fontSize: 12, color: theme.textMuted, fontStyle: 'italic' }}>No other staff members found in directory to invite.</Text>
            )}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? 'Saving Changes...' : editingMeetingId ? '💾 Save Meeting Changes' : 'Schedule & Send Invites'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Meetings List */}
      <View style={styles.section}>
        {meetings.map((meeting, idx) => {
          const isOrganizer =
            (meeting.organizer?._id && String(meeting.organizer._id) === String(user?._id)) ||
            (meeting.organizer && String(meeting.organizer) === String(user?._id)) ||
            (meeting.organizer?.email && meeting.organizer.email === user?.email);

          return (
            <View key={meeting._id || idx} style={styles.meetingCard}>
              <Text style={styles.meetingTitle}>{meeting.title}</Text>
              <Text style={styles.meetingTime}>
                📅 {safeFormatDateTime(meeting.startTime)}   ➔   {safeFormatDateTime(meeting.endTime)}
              </Text>
              <Text style={styles.meetingOrg}>Organized by {meeting.organizer?.name || 'HR Manager'} · {meeting.description || 'General Discussion'}</Text>
              {meeting.meetingLink ? (
                <TouchableOpacity onPress={() => Alert.alert('Meeting Link', meeting.meetingLink)}>
                  <Text style={{ fontSize: 12, color: '#3b82f6', fontWeight: '700', marginTop: 6 }}>
                    🔗 Join Virtual Room ({meeting.meetingLink})
                  </Text>
                </TouchableOpacity>
              ) : null}

              <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginTop: 10 }}>Invited Attendees:</Text>
              <View style={styles.attendeesRow}>
                {meeting.attendees?.map((a, i) => (
                  <View key={a._id || a.user?._id || i} style={[styles.attendeeBadge, { backgroundColor: a.status === 'accepted' ? '#d1fae5' : a.status === 'declined' ? '#fee2e2' : theme.primaryLight }]}>
                    <Text style={[styles.attendeeBadgeText, { color: a.status === 'accepted' ? '#065f46' : a.status === 'declined' ? '#991b1b' : theme.primary }]}>
                      {a.user?.name || 'Staff'} ({a.status || 'invited'})
                    </Text>
                  </View>
                ))}
              </View>

              {/* Only show RSVP buttons to invited attendees, NOT the meeting organizer */}
              {!isOrganizer ? (
                <View style={styles.rsvpRow}>
                  <TouchableOpacity style={[styles.rsvpBtn, { backgroundColor: '#ecfdf5', borderColor: '#10b981' }]} onPress={() => handleRsvp(meeting._id, 'accepted')}>
                    <Text style={[styles.rsvpBtnText, { color: '#065f46' }]}>✓ Accept RSVP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.rsvpBtn, { backgroundColor: '#fef2f2', borderColor: '#ef4444' }]} onPress={() => handleRsvp(meeting._id, 'declined')}>
                    <Text style={[styles.rsvpBtnText, { color: '#991b1b' }]}>✕ Decline</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.organizerBanner, { borderTopColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyBetween: 'space-between' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Ionicons name="mic-outline" size={16} color={theme.primary} />
                    <Text style={[styles.organizerBannerText, { color: theme.primary }]}>
                      👑 Meeting Organizer
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleEditMeeting(meeting)}
                    style={{ backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✏️ Edit Meeting</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
        {meetings.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 50 }}>
            <Ionicons name="people-circle-outline" size={48} color={theme.textMuted} />
            <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: '700', marginTop: 10 }}>No company meetings scheduled.</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>Tap '+ Schedule' above to arrange a meeting with your team.</Text>
          </View>
        )}
      </View>

      {/* ── INTERACTIVE CALENDAR & TIME PICKER MODAL ────────────────────── */}
      <Modal visible={pickerMode !== null} transparent animationType="fade" onRequestClose={() => setPickerMode(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header: Month & Year Navigation */}
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
                if (day === null) return <View key={`blank-${i}`} style={styles.dayCell} />;
                const isSelected = selectedDay === day;
                const isToday = new Date().getFullYear() === viewYear && new Date().getMonth() === viewMonth && new Date().getDate() === day;

                return (
                  <View key={`day-${day}`} style={styles.dayCell}>
                    <TouchableOpacity
                      style={[
                        styles.dayButton,
                        isSelected && styles.selectedDayBtn,
                        !isSelected && isToday && { borderWidth: 1.5, borderColor: theme.primary },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Time Picker Section */}
            <View style={styles.timePickerBox}>
              <Text style={styles.timeSectionTitle}>⏰ Select Meeting Time ({pickerMode === 'start' ? 'Start' : 'End'} Time)</Text>
              
              {/* Quick Time Pills */}
              <View style={styles.quickTimesRow}>
                {QUICK_TIMES.map((t, idx) => {
                  const active = selectedHour === t.hour && selectedMinute === t.min && selectedAmPm === t.ampm;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.quickTimeBtn, {
                        borderColor: active ? theme.primary : theme.border,
                        backgroundColor: active ? theme.primaryLight : 'transparent',
                      }]}
                      onPress={() => {
                        setSelectedHour(t.hour);
                        setSelectedMinute(t.min);
                        setSelectedAmPm(t.ampm);
                      }}
                    >
                      <Text style={[styles.quickTimeText, { color: active ? theme.primary : theme.textSecondary }]}>{t.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Time Adjusters */}
              <View style={styles.timeScrollers}>
                {/* Hour */}
                <View style={styles.timeAdjuster}>
                  <TouchableOpacity style={styles.timeArrowBtn} onPress={() => setSelectedHour((selectedHour % 12) + 1)}>
                    <Ionicons name="chevron-up" size={16} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={styles.timeAdjusterText}>{String(selectedHour).padStart(2, '0')}</Text>
                  <TouchableOpacity style={styles.timeArrowBtn} onPress={() => setSelectedHour(selectedHour === 1 ? 12 : selectedHour - 1)}>
                    <Ionicons name="chevron-down" size={16} color={theme.text} />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.colonText}>:</Text>

                {/* Minute */}
                <View style={styles.timeAdjuster}>
                  <TouchableOpacity style={styles.timeArrowBtn} onPress={() => {
                    const mins = ['00', '15', '30', '45'];
                    const idx = mins.indexOf(selectedMinute);
                    setSelectedMinute(mins[(idx + 1) % 4] || '00');
                  }}>
                    <Ionicons name="chevron-up" size={16} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={styles.timeAdjusterText}>{selectedMinute}</Text>
                  <TouchableOpacity style={styles.timeArrowBtn} onPress={() => {
                    const mins = ['00', '15', '30', '45'];
                    const idx = mins.indexOf(selectedMinute);
                    setSelectedMinute(mins[(idx - 1 + 4) % 4] || '45');
                  }}>
                    <Ionicons name="chevron-down" size={16} color={theme.text} />
                  </TouchableOpacity>
                </View>

                {/* AM / PM */}
                <TouchableOpacity
                  style={[styles.timeAdjuster, { backgroundColor: theme.primaryLight, borderColor: theme.primary, paddingHorizontal: 12 }]}
                  onPress={() => setSelectedAmPm(selectedAmPm === 'AM' ? 'PM' : 'AM')}
                >
                  <Text style={[styles.timeAdjusterText, { color: theme.primary, fontSize: 16 }]}>{selectedAmPm}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Confirm / Cancel Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setPickerMode(null)}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmModalBtn} onPress={confirmDateTime}>
                <Text style={styles.confirmModalText}>✓ Set Date & Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

export default MeetingsScreen;
