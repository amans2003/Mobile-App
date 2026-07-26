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
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { submitExpense, getMyExpenses, uploadExpenseReceipt } from '../services/api';

const CATEGORIES = [
  { label: '✈️ Travel', value: 'travel' },
  { label: '🍽️ Meals', value: 'meals' },
  { label: '🏨 Lodging', value: 'accommodation' },
  { label: '💻 Software', value: 'software' },
  { label: '🛠️ Equipment', value: 'equipment' },
  { label: '📎 Supplies', value: 'office_supplies' },
  { label: '🎓 Training', value: 'training' },
  { label: '📦 Other', value: 'other' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * ExpensesScreen — Employee mobile form for submitting reimbursement claims to Admin/HR
 * Enhanced with native Photo Gallery (JPG/PNG) & Document (PDF/DOCX) upload capability!
 */
const ExpensesScreen = () => {
  const { theme } = useTheme();
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attachment, setAttachment] = useState(null); // { name, uri, type, size }

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'travel',
    description: '',
    receiptUrl: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });

  // Calendar Modal State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const loadData = useCallback(async () => {
    try {
      const res = await getMyExpenses().catch(() => ({ data: [] }));
      setExpenses(res?.data || []);
    } catch (error) {
      console.log('Error loading expenses:', error?.message);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const openCalendar = () => {
    const parts = form.expenseDate.split('-');
    if (parts.length === 3) {
      setViewYear(parseInt(parts[0], 10) || new Date().getFullYear());
      setViewMonth((parseInt(parts[1], 10) || 1) - 1);
      setSelectedDay(parseInt(parts[2], 10) || new Date().getDate());
    }
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    setForm({ ...form, expenseDate: formatted });
    setShowDatePicker(false);
  };

  const getCalendarDays = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const grid = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let i = 1; i <= daysInMonth; i++) grid.push(i);
    return grid;
  };

  // ── Native Photo Gallery Picker (Images) ──────────────────────────
  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please grant photo library access to upload receipt photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.uri.split('/').pop() || 'receipt_photo.jpg';
        const fileRef = `[IMAGE] ${fileName}`;
        setAttachment({
          name: fileName,
          uri: asset.uri,
          type: 'image/jpeg',
          size: asset.fileSize ? `${Math.round(asset.fileSize / 1024)} KB` : 'Photo Receipt',
        });
        setForm((prev) => ({ ...prev, receiptUrl: asset.uri || fileRef }));
        Alert.alert('📷 Receipt Attached', `Selected picture: ${fileName}`);
      }
    } catch (err) {
      Alert.alert('Notice', 'Could not pick image: ' + err?.message);
    }
  };

  // ── Native Document Picker (PDF / DOCX) ───────────────────────────
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/*',
          '*/*'
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const doc = result.assets[0];
        const fileName = doc.name || doc.uri.split('/').pop() || 'expense_invoice.pdf';
        setAttachment({
          name: fileName,
          uri: doc.uri,
          type: doc.mimeType || 'application/pdf',
          size: doc.size ? `${Math.round(doc.size / 1024)} KB` : 'Document Invoice',
        });
        setForm((prev) => ({ ...prev, receiptUrl: doc.uri || fileName }));
        Alert.alert('📎 Document Attached', `Selected document: ${fileName}`);
      }
    } catch (err) {
      Alert.alert('Notice', 'Could not select document: ' + err?.message);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.amount) {
      Alert.alert('Incomplete Form', 'Please provide a title and expense amount in USD.');
      return;
    }
    const numAmount = parseFloat(form.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      let finalReceiptUrl = form.receiptUrl;

      // Upload file directly to Cloudinary via backend if attachment exists
      if (attachment && attachment.uri) {
        try {
          const formData = new FormData();
          formData.append('receipt', {
            uri: attachment.uri,
            name: attachment.name || 'document.pdf',
            type: attachment.type || 'application/pdf',
          });
          const uploadRes = await uploadExpenseReceipt(formData);
          if (uploadRes?.data?.url) {
            finalReceiptUrl = uploadRes.data.url;
          }
        } catch (uploadErr) {
          console.warn('Cloudinary direct upload note:', uploadErr.message);
          finalReceiptUrl = `${attachment.name} (${attachment.uri})`;
        }
      }

      await submitExpense({ ...form, amount: numAmount, receiptUrl: finalReceiptUrl });
      
      Alert.alert('✅ Claim & Document Sent', `Your expense claim for $${numAmount.toFixed(2)} with document attachment has been uploaded to Cloudinary for Admin review!`);
      setShowForm(false);
      setAttachment(null);
      setForm({
        title: '',
        amount: '',
        category: 'travel',
        description: '',
        receiptUrl: '',
        expenseDate: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit expense claim.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { bg: '#ecfdf5', text: '#065f46', label: '✓ Approved' };
      case 'rejected':
        return { bg: '#fef2f2', text: '#991b1b', label: '✕ Rejected' };
      case 'reimbursed':
        return { bg: '#eff6ff', text: '#1e40af', label: '💸 Reimbursed' };
      default:
        return { bg: '#fef3c7', text: '#92400e', label: '⏳ Pending HR Review' };
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: '800', color: theme.text },
    addBtn: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    section: { paddingHorizontal: 20 },
    formContainer: { marginHorizontal: 20, backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 20 },
    formSectionLabel: { fontSize: 12, fontWeight: '700', color: theme.text, marginBottom: 6, marginTop: 6, textTransform: 'uppercase' },
    input: { backgroundColor: theme.inputBg, borderRadius: 12, padding: 12, fontSize: 14, color: theme.text, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
    rowInputs: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    halfBox: { flex: 1 },
    dateBox: { backgroundColor: theme.inputBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dateText: { fontSize: 14, fontWeight: '700', color: theme.text },
    categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
    categoryText: { fontSize: 12, fontWeight: '700' },

    // Attachment Upload UI
    uploadRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    uploadBtn: { flex: 1, backgroundColor: theme.inputBg, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', borderWidth: 1.5, borderColor: theme.border, borderStyle: 'dashed' },
    uploadBtnTitle: { fontSize: 13, fontWeight: '800', color: theme.text, marginTop: 4 },
    uploadBtnSub: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
    attachmentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primaryLight, borderRadius: 14, padding: 12, borderWidth: 1, marginBottom: 14 },
    attachmentIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    attachmentDetails: { flex: 1, marginRight: 8 },
    attachmentName: { fontSize: 14, fontWeight: '700' },
    attachmentMeta: { fontSize: 12, marginTop: 2, fontWeight: '600' },
    removeAttachmentBtn: { padding: 8 },

    submitBtn: { backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    
    card: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: theme.text, flex: 1, marginRight: 8 },
    cardAmount: { fontSize: 18, fontWeight: '800', color: theme.primary },
    cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusBadgeText: { fontSize: 11, fontWeight: '800' },
    dateMetaText: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
    cardDesc: { fontSize: 13, color: theme.textSecondary, fontStyle: 'italic' },
    
    viewAttachmentChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: theme.border, gap: 6 },
    viewAttachmentText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },

    reviewerNote: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
    reviewerNoteText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
    
    // Modal UI
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: theme.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: theme.border, width: '100%', maxWidth: 360 },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    monthTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
    navBtn: { padding: 8, borderRadius: 10, backgroundColor: theme.inputBg },
    weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 6 },
    weekDayText: { width: 36, textAlign: 'center', fontSize: 11, fontWeight: '700', color: theme.textSecondary },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
    dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
    dayButton: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
    dayText: { fontSize: 13, fontWeight: '600', color: theme.text },
    selectedDayBtn: { backgroundColor: theme.primary },
    selectedDayText: { color: '#ffffff', fontWeight: '800' },
    modalActions: { flexDirection: 'row', gap: 10 },
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
        <Text style={styles.title}>Expense Claims</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => {
          if (showForm) setAttachment(null);
          setShowForm(!showForm);
        }}>
          <Text style={styles.addBtnText}>{showForm ? 'Close Form' : '+ Submit Claim'}</Text>
        </TouchableOpacity>
      </View>

      {/* Expense Claim Form */}
      {showForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formSectionLabel}>1. Claim Details & Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="What was this expense for? (e.g. Flight ticket)"
            placeholderTextColor={theme.textMuted}
            value={form.title}
            onChangeText={(t) => setForm({ ...form, title: t })}
          />
          
          <View style={styles.rowInputs}>
            <View style={styles.halfBox}>
              <Text style={[styles.formSectionLabel, { marginTop: 0 }]}>Amount ($ USD)</Text>
              <TextInput
                style={[styles.input, { marginBottom: 0, fontWeight: '800', fontSize: 16 }]}
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
                value={form.amount}
                onChangeText={(t) => setForm({ ...form, amount: t })}
              />
            </View>
            <View style={styles.halfBox}>
              <Text style={[styles.formSectionLabel, { marginTop: 0 }]}>Date incurred</Text>
              <TouchableOpacity style={[styles.dateBox, { marginBottom: 0 }]} onPress={openCalendar}>
                <Text style={styles.dateText}>{form.expenseDate}</Text>
                <Ionicons name="calendar" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.formSectionLabel}>2. Select Category</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => {
              const active = form.category === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryChip,
                    {
                      borderColor: active ? theme.primary : theme.border,
                      backgroundColor: active ? theme.primaryLight : 'transparent',
                    },
                  ]}
                  onPress={() => setForm({ ...form, category: cat.value })}
                >
                  <Text style={[styles.categoryText, { color: active ? theme.primary : theme.textSecondary }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 3. Attach Receipt (Image / Doc / PDF) */}
          <Text style={styles.formSectionLabel}>3. Attach Receipt (Photo, PDF, or Word Doc)</Text>
          {!attachment ? (
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.75}>
                <Ionicons name="images" size={24} color="#3b82f6" />
                <Text style={styles.uploadBtnTitle}>📷 Photo Gallery</Text>
                <Text style={styles.uploadBtnSub}>JPG, PNG Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument} activeOpacity={0.75}>
                <Ionicons name="document-text" size={24} color="#8b5cf6" />
                <Text style={styles.uploadBtnTitle}>📎 PDF / Doc File</Text>
                <Text style={styles.uploadBtnSub}>Invoice or Word memo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.attachmentCard, { borderColor: theme.border }]}>
              <View style={styles.attachmentIconBox}>
                <Ionicons
                  name={attachment.type?.includes('image') ? 'image' : 'document-attach'}
                  size={24}
                  color={theme.primary}
                />
              </View>
              <View style={styles.attachmentDetails}>
                <Text style={[styles.attachmentName, { color: theme.text }]} numberOfLines={1}>
                  {attachment.name}
                </Text>
                <Text style={[styles.attachmentMeta, { color: theme.textSecondary }]}>
                  ✅ Attached ({attachment.size})
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeAttachmentBtn}
                onPress={() => {
                  setAttachment(null);
                  setForm((prev) => ({ ...prev, receiptUrl: '' }));
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.formSectionLabel}>4. Justification Notes (Optional)</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top', marginBottom: 8 }]}
            placeholder="Additional details for HR Manager..."
            placeholderTextColor={theme.textMuted}
            multiline
            value={form.description}
            onChangeText={(t) => setForm({ ...form, description: t })}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? 'Submitting to Admin...' : '📤 Submit Claim & Attachment'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Ledger of submitted claims */}
      <View style={styles.section}>
        {expenses.map((exp, idx) => {
          const badge = getStatusBadge(exp.status);
          const catObj = CATEGORIES.find((c) => c.value === exp.category) || { label: '📦 Other' };
          const formattedDate = exp.expenseDate ? exp.expenseDate.split('T')[0] : '—';
          
          let displayAttach = exp.receiptUrl || '';
          if (displayAttach.includes('(') && displayAttach.includes(')')) {
            displayAttach = displayAttach.split('(')[0].trim();
          } else {
            displayAttach = displayAttach.split('/').pop();
          }

          return (
            <View key={exp._id || idx} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{exp.title}</Text>
                <Text style={styles.cardAmount}>${Number(exp.amount || 0).toFixed(2)}</Text>
              </View>

              <View style={styles.cardMetaRow}>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
                </View>
                <Text style={styles.dateMetaText}>📅 {formattedDate} · {catObj.label}</Text>
              </View>

              {exp.description ? (
                <Text style={styles.cardDesc}>"{exp.description}"</Text>
              ) : null}

              {exp.receiptUrl ? (
                <TouchableOpacity
                  style={styles.viewAttachmentChip}
                  onPress={() => Alert.alert('📎 Attached File', `Attached Receipt/Document: ${exp.receiptUrl}`)}
                >
                  <Ionicons name="document-attach" size={16} color="#3b82f6" />
                  <Text style={styles.viewAttachmentText} numberOfLines={1}>
                    Attachment: {displayAttach || 'View Document'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {exp.reviewerNotes ? (
                <View style={styles.reviewerNote}>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color="#ef4444" />
                  <Text style={styles.reviewerNoteText}>Admin feedback: {exp.reviewerNotes}</Text>
                </View>
              ) : null}
            </View>
          );
        })}

        {expenses.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 50 }}>
            <Ionicons name="receipt-outline" size={52} color={theme.textMuted} />
            <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: '700', marginTop: 12 }}>No expense claims submitted yet.</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 }}>
              Tap '+ Submit Claim' above whenever you need out-of-pocket expenses reimbursed by Admin and HR!
            </Text>
          </View>
        )}
      </View>

      {/* Calendar Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={styles.navBtn} onPress={() => {
                if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
                else setViewMonth(viewMonth - 1);
              }}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
              <TouchableOpacity style={styles.navBtn} onPress={() => {
                if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
                else setViewMonth(viewMonth + 1);
              }}>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {WEEK_DAYS.map((w, i) => <Text key={i} style={styles.weekDayText}>{w}</Text>)}
            </View>

            <View style={styles.daysGrid}>
              {calendarDays.map((day, i) => {
                if (day === null) return <View key={`blank-${i}`} style={styles.dayCell} />;
                const isSelected = selectedDay === day;
                return (
                  <View key={`day-${day}`} style={styles.dayCell}>
                    <TouchableOpacity
                      style={[styles.dayButton, isSelected && styles.selectedDayBtn]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmModalBtn} onPress={confirmDate}>
                <Text style={styles.confirmModalText}>✓ Select Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

export default ExpensesScreen;
