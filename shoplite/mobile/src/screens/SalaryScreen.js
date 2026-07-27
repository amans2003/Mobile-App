import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getMySalary } from '../services/api';

/**
 * Safe currency formatter that does not throw on unsupported locales
 */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  } catch (e) {
    return `₹${Number(amount).toLocaleString()}`;
  }
};

/**
 * SalaryScreen — Personal salary history and payslip viewer
 */
const SalaryScreen = () => {
  const { theme } = useTheme();
  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const loadSalary = useCallback(async () => {
    try {
      const res = await getMySalary();
      setRecords(res?.data || []);
    } catch (error) {
      // Use console.log instead of console.error to prevent Expo Go Red Box on network/404 error
      console.log('Load salary fallback info:', error?.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSalary();
    }, [loadSalary])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSalary();
    setRefreshing(false);
  }, [loadSalary]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
    title: { fontSize: 24, fontWeight: '800', color: theme.text },
    subtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
    latestCard: { marginHorizontal: 20, backgroundColor: theme.primary, borderRadius: 20, padding: 24, marginBottom: 20 },
    latestLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    latestAmount: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 4 },
    latestMeta: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
    section: { paddingHorizontal: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12 },
    card: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    monthLabel: { fontSize: 14, fontWeight: '700', color: theme.text },
    netAmount: { fontSize: 16, fontWeight: '800', color: theme.primary },
    expandedRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 },
    expandedLabel: { fontSize: 12, color: theme.textSecondary },
    expandedValue: { fontSize: 12, fontWeight: '600', color: theme.text },
    divider: { height: 1, backgroundColor: theme.border, marginVertical: 8 },
    emptyText: { color: theme.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 40 },
  });

  const latest = records.length > 0 ? records[0] : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Salary</Text>
        <Text style={styles.subtitle}>Your monthly earnings & payslips</Text>
      </View>

      {/* Latest Salary Card */}
      {latest && (
        <View style={[styles.latestCard, { backgroundColor: '#1e1b4b', borderColor: '#4338ca', borderWidth: 1 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={[styles.latestLabel, { color: '#a5b4fc', textTransform: 'uppercase', fontWeight: '800' }]}>Total Take-Home Pay</Text>
              <Text style={[styles.latestAmount, { color: '#10b981', fontWeight: '900', fontSize: 34 }]}>{formatCurrency(latest.netSalary)}</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#10b981' }}>
              <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '900' }}>{months[latest.month - 1]} {latest.year}</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 16 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#c7d2fe', fontSize: 11, fontWeight: '700' }}>✓ Days Present</Text>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900', marginTop: 2 }}>{latest.presentDays ?? 0} / {latest.workingDays ?? 26} Days</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ color: '#fca5a5', fontSize: 11, fontWeight: '700' }}>⚠️ Deducted Money</Text>
              <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '900', marginTop: 2 }}>-{formatCurrency(latest.totalDeductions || 0)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Salary History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salary History</Text>
        {records.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No salary records found or backend offline. Pull down to refresh.</Text>
          </View>
        ) : (
          records.map((rec) => (
            <TouchableOpacity key={rec._id} style={styles.card} onPress={() => setExpandedId(expandedId === rec._id ? null : rec._id)} activeOpacity={0.7}>
              <View style={styles.cardHeader}>
                <Text style={styles.monthLabel}>{months[rec.month - 1]} {rec.year}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.netAmount}>{formatCurrency(rec.netSalary)}</Text>
                  <Ionicons name={expandedId === rec._id ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textMuted} />
                </View>
              </View>

              {expandedId === rec._id && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#10b981', marginBottom: 6 }}>Earnings</Text>
                  <View style={styles.expandedRow}>
                    <Text style={styles.expandedLabel}>Basic</Text>
                    <Text style={styles.expandedValue}>{formatCurrency(rec.basic)}</Text>
                  </View>
                  <View style={styles.expandedRow}>
                    <Text style={styles.expandedLabel}>HRA</Text>
                    <Text style={styles.expandedValue}>{formatCurrency(rec.hra)}</Text>
                  </View>
                  <View style={styles.expandedRow}>
                    <Text style={styles.expandedLabel}>Transport</Text>
                    <Text style={styles.expandedValue}>{formatCurrency(rec.transport)}</Text>
                  </View>
                  <View style={styles.expandedRow}>
                    <Text style={styles.expandedLabel}>Medical</Text>
                    <Text style={styles.expandedValue}>{formatCurrency(rec.medical)}</Text>
                  </View>
                  <View style={styles.expandedRow}>
                    <Text style={styles.expandedLabel}>Special</Text>
                    <Text style={styles.expandedValue}>{formatCurrency(rec.special)}</Text>
                  </View>
                  {rec.overtime > 0 && (
                    <View style={styles.expandedRow}>
                      <Text style={styles.expandedLabel}>Overtime</Text>
                      <Text style={[styles.expandedValue, { color: '#10b981' }]}>+{formatCurrency(rec.overtime)}</Text>
                    </View>
                  )}
                  <View style={styles.expandedRow}>
                    <Text style={[styles.expandedLabel, { fontWeight: '700' }]}>Gross Total</Text>
                    <Text style={[styles.expandedValue, { fontWeight: '800', color: '#10b981' }]}>{formatCurrency(rec.grossSalary)}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.divider} />

                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#ef4444', marginBottom: 6, textTransform: 'uppercase' }}>Deductibles & Absences</Text>
                  <View style={styles.expandedRow}>
                    <Text style={styles.expandedLabel}>Tax</Text>
                    <Text style={[styles.expandedValue, { color: '#ef4444' }]}>-{formatCurrency(rec.tax)}</Text>
                  </View>
                  <View style={styles.expandedRow}>
                    <Text style={styles.expandedLabel}>Insurance</Text>
                    <Text style={[styles.expandedValue, { color: '#ef4444' }]}>-{formatCurrency(rec.insurance)}</Text>
                  </View>
                  <View style={styles.expandedRow}>
                    <Text style={styles.expandedLabel}>Provident Fund</Text>
                    <Text style={[styles.expandedValue, { color: '#ef4444' }]}>-{formatCurrency(rec.providentFund)}</Text>
                  </View>
                  {rec.unpaidLeaveDeduction > 0 ? (
                    <View style={[styles.expandedRow, { backgroundColor: 'rgba(239,68,68,0.08)', padding: 6, borderRadius: 8, marginTop: 4 }]}>
                      <Text style={[styles.expandedLabel, { color: '#dc2626', fontWeight: '800' }]}>⚠️ Unpaid Absent Days ({rec.unpaidLeaveDays}d)</Text>
                      <Text style={[styles.expandedValue, { color: '#dc2626', fontWeight: '900' }]}>-{formatCurrency(rec.unpaidLeaveDeduction)}</Text>
                    </View>
                  ) : (
                    <View style={[styles.expandedRow, { backgroundColor: 'rgba(16,185,129,0.08)', padding: 6, borderRadius: 8, marginTop: 4 }]}>
                      <Text style={[styles.expandedLabel, { color: '#059669', fontWeight: '800' }]}>✓ Unpaid Absence Deduction</Text>
                      <Text style={[styles.expandedValue, { color: '#059669', fontWeight: '900' }]}>₹0 (100% Attendance)</Text>
                    </View>
                  )}
                  <View style={styles.expandedRow}>
                    <Text style={[styles.expandedLabel, { fontWeight: '800', color: '#ef4444' }]}>Total Money Deducted</Text>
                    <Text style={[styles.expandedValue, { fontWeight: '900', color: '#ef4444' }]}>-{formatCurrency(rec.totalDeductions || 0)}</Text>
                  </View>

                  <View style={styles.divider} />
                  <View style={[styles.expandedRow, { backgroundColor: 'rgba(16,185,129,0.1)', padding: 10, borderRadius: 12, marginTop: 4 }]}>
                    <View>
                      <Text style={[styles.expandedLabel, { fontWeight: '900', fontSize: 13, color: '#065f46' }]}>TOTAL YOU ARE GETTING</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#047857', marginTop: 2 }}>✓ Days Present: {rec.presentDays ?? 0} / {rec.workingDays ?? 26}</Text>
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#059669' }}>{formatCurrency(rec.netSalary)}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

export default SalaryScreen;
