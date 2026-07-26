import { useState, useEffect } from 'react';
import { fetchAttendanceLogs, fetchAttendanceStats, fetchAttendanceRules, updateAttendanceRules, updateAttendanceStatus } from '../services/api';

/**
 * Attendance — Enterprise Custom Timing & Half-Day Governance Hub
 * Fully responsive redesign with custom timing configuration and zero-arrow manual numerical typing.
 */
const Attendance = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Custom Timing Rules State
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [rules, setRules] = useState({
    officeStartTime: '10:00',
    halfDayThreshold: '10:30',
    afternoonThreshold: '14:00',
    officeEndTime: '19:00',
    workingDaysPerMonth: '26',
    autoCalculateHalfDay: true,
  });
  const [savingRules, setSavingRules] = useState(false);

  // HR Manual Override Modal State
  const [editingLog, setEditingLog] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    status: 'half_day',
    manualReason: 'Employee left office after 2:00 PM - manually adjusted to Half Day by HR',
  });
  const [savingOverride, setSavingOverride] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes, rulesRes] = await Promise.all([
        fetchAttendanceLogs({ date: selectedDate }),
        fetchAttendanceStats(),
        fetchAttendanceRules().catch(() => null),
      ]);
      setLogs(logsRes.data || []);
      setStats(statsRes.data || null);
      if (rulesRes && rulesRes.data) {
        setRules({
          ...rulesRes.data,
          workingDaysPerMonth: String(rulesRes.data.workingDaysPerMonth || 26)
        });
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Handle Saving Custom Office Timings & Rules
  const handleSaveRules = async (e) => {
    e.preventDefault();
    try {
      setSavingRules(true);
      const payload = {
        ...rules,
        workingDaysPerMonth: Number(rules.workingDaysPerMonth || 26)
      };
      await updateAttendanceRules(payload);
      alert('✅ Custom office timings and Half-Day salary calculation rules saved successfully!');
      setShowRulesPanel(false);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating custom attendance rules');
    } finally {
      setSavingRules(false);
    }
  };

  // Handle HR Manual Status Override
  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!editingLog) return;
    try {
      setSavingOverride(true);
      await updateAttendanceStatus(editingLog._id, overrideForm);
      alert(`✅ Attendance status changed to ${overrideForm.status.toUpperCase()} and reason recorded for salary calculation!`);
      setEditingLog(null);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to override attendance status');
    } finally {
      setSavingOverride(false);
    }
  };

  const statusColors = {
    present: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    half_day: 'bg-amber-100 text-amber-900 border-amber-400 font-extrabold shadow-sm',
    late: 'bg-orange-100 text-orange-800 border-orange-300',
    absent: 'bg-rose-100 text-rose-800 border-rose-300',
    on_leave: 'bg-blue-100 text-blue-800 border-blue-300',
    holiday: 'bg-purple-100 text-purple-800 border-purple-300',
    weekend: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Premium Dark Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 md:p-8 text-white shadow-2xl mb-8 border border-indigo-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-3 border border-amber-500/30">
              <span>📅</span> Live Attendance & Half-Day Engine
            </span>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">Daily Attendance Register</h1>
            <p className="text-slate-300 text-xs md:text-sm font-medium mt-2 max-w-2xl">
              Office hours: <strong className="text-amber-300 font-black">{rules.officeStartTime || '10:00'} to {rules.officeEndTime || '19:00'}</strong> · Auto Half-Day thresholds: arrivals after <strong className="text-amber-300 font-black">{rules.halfDayThreshold || '10:30'}</strong> or departures after <strong className="text-amber-300 font-black">{rules.afternoonThreshold || '14:00'}</strong> are automatically scored as Half Day (0.5 Salary Credit).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowRulesPanel(!showRulesPanel)}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer"
            >
              <span>⚙️</span>
              <span>{showRulesPanel ? 'Close Config' : 'Custom Office Timings'}</span>
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-white/10 text-white font-extrabold text-xs sm:text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-sm backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      {/* ⚙️ Custom Office Timing & Half-Day Rules Config Panel (Zero Up-Down Arrows) */}
      {showRulesPanel && (
        <div className="mb-8 bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50 rounded-3xl p-6 md:p-8 border-2 border-amber-400 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-amber-200/80 pb-4">
            <div>
              <h2 className="text-base md:text-lg font-black text-amber-950 flex items-center gap-2">
                <span>⚙️</span>
                <span>Configure Custom Office Timings & Auto Half-Day Cutoffs</span>
              </h2>
              <p className="text-xs text-amber-800 font-extrabold mt-0.5">
                Set custom office hours and manual numeric working days without stepper buttons. Directly integrated with monthly payroll!
              </p>
            </div>
            <span className="text-xs bg-amber-200 text-amber-950 px-4 py-1.5 rounded-full font-black shadow-inner self-start sm:self-auto">
              ⚡ Salary Pro-Rata Engine Connected
            </span>
          </div>

          <form onSubmit={handleSaveRules} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-black text-amber-950 mb-1.5">Office Start Time</label>
                <input
                  type="text"
                  placeholder="e.g. 10:00"
                  value={rules.officeStartTime}
                  onChange={(e) => setRules({ ...rules, officeStartTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-amber-300 bg-white text-sm font-black text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] font-extrabold text-amber-800 mt-1 block">Standard Check-In</span>
              </div>
              <div>
                <label className="block text-xs font-black text-rose-900 mb-1.5">Arrival Half-Day Cutoff *</label>
                <input
                  type="text"
                  placeholder="e.g. 10:30"
                  value={rules.halfDayThreshold}
                  onChange={(e) => setRules({ ...rules, halfDayThreshold: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-rose-300 bg-white text-sm font-black text-rose-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] font-black text-rose-800 mt-1 block">Arrivals after = Auto 0.5 Day</span>
              </div>
              <div>
                <label className="block text-xs font-black text-orange-950 mb-1.5">Afternoon Cutoff (2 PM) *</label>
                <input
                  type="text"
                  placeholder="e.g. 14:00"
                  value={rules.afternoonThreshold}
                  onChange={(e) => setRules({ ...rules, afternoonThreshold: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-orange-300 bg-white text-sm font-black text-orange-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] font-black text-orange-800 mt-1 block">Early departure cutoff</span>
              </div>
              <div>
                <label className="block text-xs font-black text-amber-950 mb-1.5">Office End Time</label>
                <input
                  type="text"
                  placeholder="e.g. 19:00"
                  value={rules.officeEndTime}
                  onChange={(e) => setRules({ ...rules, officeEndTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-amber-300 bg-white text-sm font-black text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] font-extrabold text-amber-800 mt-1 block">Standard Check-Out</span>
              </div>
              <div>
                <label className="block text-xs font-black text-indigo-950 mb-1.5">Monthly Working Days (No Arrows)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={rules.workingDaysPerMonth ?? '26'}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setRules({ ...rules, workingDaysPerMonth: val });
                  }}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-indigo-300 bg-white text-sm font-black text-indigo-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] font-black text-indigo-800 mt-1 block">Manual text input</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-amber-200">
              <button
                type="button"
                onClick={() => setShowRulesPanel(false)}
                className="px-6 py-3 bg-white text-slate-700 hover:bg-slate-100 font-extrabold text-xs sm:text-sm rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingRules}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingRules ? 'Saving Rules...' : '💾 Save Custom Timings & Salary Rules'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Today's Responsive Statistical Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/15 transform hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-100">Present (1.0 Pay)</span>
              <span className="text-xl">✓</span>
            </div>
            <p className="text-3xl sm:text-4xl font-black mt-2">{stats.present || 0}</p>
            <p className="text-[11px] font-extrabold text-emerald-100 mt-1">100% Salary Credit</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-5 text-white shadow-lg shadow-amber-500/15 transform hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-100">Half Day (0.5 Pay)</span>
              <span className="text-xl">🌓</span>
            </div>
            <p className="text-3xl sm:text-4xl font-black mt-2">{stats.halfDay || 0}</p>
            <p className="text-[11px] font-extrabold text-amber-100 mt-1">Late / Early Cutoff</p>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl p-5 text-white shadow-lg shadow-rose-500/15 transform hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-100">Absent (0.0 Pay)</span>
              <span className="text-xl">✗</span>
            </div>
            <p className="text-3xl sm:text-4xl font-black mt-2">{stats.absent || 0}</p>
            <p className="text-[11px] font-extrabold text-rose-100 mt-1">Unpaid Absence</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 text-white shadow-lg shadow-indigo-500/15 transform hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-100">On Paid Leave</span>
              <span className="text-xl">🏖️</span>
            </div>
            <p className="text-3xl sm:text-4xl font-black mt-2">{stats.onLeave || 0}</p>
            <p className="text-[11px] font-extrabold text-indigo-100 mt-1">Approved Quota</p>
          </div>
          <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl p-5 text-white shadow-lg transform hover:-translate-y-0.5 transition-all col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">Late Arrivals</span>
              <span className="text-xl">⏰</span>
            </div>
            <p className="text-3xl sm:text-4xl font-black mt-2">{stats.late || 0}</p>
            <p className="text-[11px] font-extrabold text-slate-300 mt-1">After {rules.halfDayThreshold || '10:30'}</p>
          </div>
        </div>
      )}

      {/* Responsive Staff Attendance Table */}
      {loading ? (
        <div className="flex justify-center items-center py-28">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/75 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider">
                Staff Attendance Register ({selectedDate})
              </h3>
            </div>
            <span className="text-xs text-indigo-950 font-black bg-indigo-100 px-3 py-1.5 rounded-full self-start sm:self-auto shadow-inner">
              💡 Tip: Click "✎ HR Override" to manually mark Half Day or give early departure notes
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-100/60">
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-wider">Check In</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-wider">Check Out</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-wider">Duration</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-wider">Status & HR Remarks</th>
                  <th className="text-right px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-wider">HR Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-all duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 flex items-center justify-center text-white text-base font-black shadow-md">
                          {log.employee?.name?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{log.employee?.name}</p>
                          <p className="text-xs font-bold text-indigo-600">{log.employee?.department || 'Staff'} · <span className="text-slate-400 font-mono">ID: {log.employee?.employeeId || 'EMP'}</span></p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                        {formatTime(log.checkIn?.time)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                        {formatTime(log.checkOut?.time)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-extrabold text-indigo-950 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 shadow-inner">
                        {log.workHours ? `${log.workHours} hrs` : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`inline-block px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide border ${statusColors[log.status] || 'bg-gray-100 text-gray-700'}`}>
                          {log.status === 'half_day' ? '🌓 HALF DAY (0.5 Salary Pay)' : log.status?.replace('_', ' ').toUpperCase()}
                        </span>
                        {log.isManuallyEdited || log.manualReason ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-800 bg-rose-50/90 px-3 py-1.5 rounded-xl border border-rose-200 max-w-sm truncate shadow-sm" title={log.manualReason}>
                            <span>💬 HR Override:</span> {log.manualReason}
                          </span>
                        ) : log.notes ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl max-w-sm truncate border border-slate-200" title={log.notes}>
                            <span>🤖 Auto Rule:</span> {log.notes}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditingLog(log);
                          setOverrideForm({
                            status: log.status || 'half_day',
                            manualReason: log.manualReason || 'Employee left office after 2:00 PM - manually adjusted to Half Day by HR',
                          });
                        }}
                        className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs sm:text-sm rounded-2xl border border-indigo-200 shadow-sm inline-flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
                      >
                        <span>✎</span>
                        <span>HR Override / Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <span className="text-5xl block mb-3">📭</span>
              <p className="text-base font-bold text-slate-600">No attendance check-ins recorded for {selectedDate}</p>
              <p className="text-xs text-slate-400 mt-1">Check-ins from the mobile app will populate this live attendance dashboard immediately!</p>
            </div>
          )}
        </div>
      )}

      {/* ✎ HR Manual Override Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-900 p-6 text-white border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-black flex items-center gap-2">
                  <span>✎</span>
                  <span>HR Attendance Manual Override</span>
                </h3>
                <p className="text-xs text-indigo-200 mt-1 font-medium">
                  Adjusting status for <strong className="text-white font-black">{editingLog.employee?.name}</strong> on <strong className="text-white font-black">{selectedDate}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditingLog(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="p-6 md:p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wider">Select Attendance Status *</label>
                <select
                  value={overrideForm.status}
                  onChange={(e) => setOverrideForm({ ...overrideForm, status: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="half_day">🌓 Half Day (0.5 Working Day Salary Credit)</option>
                  <option value="present">✓ Present (Full Day - 1.0 Salary Credit)</option>
                  <option value="late">⚠️ Late Check-In (Full Day - 1.0 Credit)</option>
                  <option value="absent">✗ Absent (0.0 Salary Credit / Unpaid Deduction)</option>
                  <option value="on_leave">🏖️ On Paid Leave (1.0 Salary Credit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wider">Reason / HR Audit Remark *</label>
                <textarea
                  rows="3"
                  required
                  value={overrideForm.manualReason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, manualReason: e.target.value })}
                  placeholder="e.g. Employee left early after 2:00 PM due to personal reasons..."
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-2 font-bold bg-slate-50 p-3 rounded-xl border border-slate-100">
                  ⚡ <strong>Note:</strong> This remark will be permanently saved and utilized to justify pay deductions during monthly payroll processing!
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-black rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOverride}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black rounded-2xl shadow-xl shadow-indigo-600/25 transition-all duration-200 disabled:opacity-50 transform active:scale-95 cursor-pointer"
                >
                  {savingOverride ? 'Updating Status...' : '✓ Save Override & Adjust Salary Credit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
