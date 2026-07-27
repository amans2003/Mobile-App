import { useState, useEffect } from 'react';
import { fetchAllAttendance, fetchAttendanceStats, checkIn, checkOut, overrideAttendance, fetchAttendanceRules, updateAttendanceRules } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Attendance — Structured Responsive Register & Timing Rule Hub
 * Executive slate-900 & white theme with small boxes and pro-rata half-day rules (10:30 AM / 2:00 PM).
 */
const Attendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Office Timing Customization state with live auto-calculation & deduction settings
  const [officeTiming, setOfficeTiming] = useState({
    start: '09:00',
    halfDayCutoff: '13:00',
    end: '18:00',
    halfDayWorkingHours: 4.5,
    customDeductionAmount: 0,
  });
  const [showConfig, setShowConfig] = useState(false);

  // HR Override modal state
  const [overrideModal, setOverrideModal] = useState({ show: false, record: null, status: 'half_day', notes: '' });

  const parseTimeToDec = (tStr) => {
    if (!tStr) return 0;
    const [h, m] = String(tStr).split(':').map(Number);
    return (h || 0) + (m || 0) / 60.0;
  };

  const calcShiftTotalHours = (start, end) => {
    const s = parseTimeToDec(start);
    let e = parseTimeToDec(end);
    if (e < s) e += 24;
    return Math.max(0, Math.round((e - s) * 100) / 100);
  };

  const formatDecToText = (dec) => {
    if (isNaN(dec) || dec <= 0) return '0 Hours';
    const hrs = Math.floor(dec);
    const mins = Math.round((dec - hrs) * 60);
    if (hrs > 0 && mins > 0) return `${hrs} Hours ${mins} Mins`;
    if (hrs > 0) return `${hrs} Hours`;
    return `${mins} Mins`;
  };

  const handleTimingChange = (field, value) => {
    const updated = { ...officeTiming, [field]: value };
    if (field === 'start' || field === 'end') {
      const tot = calcShiftTotalHours(updated.start, updated.end);
      updated.halfDayWorkingHours = Math.round((tot / 2) * 100) / 100;
    }
    setOfficeTiming(updated);
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const [recordsRes, statsRes, rulesRes] = await Promise.all([
        fetchAllAttendance({ date: dateFilter }).catch(() => ({ data: [] })),
        fetchAttendanceStats().catch(() => ({ data: { present: 0, late: 0, absent: 0, onLeave: 0 } })),
        fetchAttendanceRules().catch(() => ({ data: null })),
      ]);
      setRecords(recordsRes.data || []);
      setStats(statsRes.data);
      if (rulesRes.data) {
        const start = rulesRes.data.officeStartTime || '09:00';
        const end = rulesRes.data.officeEndTime || '18:00';
        const tot = calcShiftTotalHours(start, end);
        setOfficeTiming({
          start,
          halfDayCutoff: rulesRes.data.halfDayThreshold || '13:00',
          end,
          halfDayWorkingHours: rulesRes.data.halfDayWorkingHours ?? (tot / 2),
          customDeductionAmount: rulesRes.data.customDeductionAmount || 0,
        });
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [dateFilter]);

  const handleCheckIn = async () => {
    try {
      await checkIn({ date: dateFilter });
      loadAttendance();
    } catch (error) {
      alert(error.response?.data?.message || 'Error recording check-in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut({ date: dateFilter });
      loadAttendance();
    } catch (error) {
      alert(error.response?.data?.message || 'Error recording check-out');
    }
  };

  const handleSaveTimings = async () => {
    if (Number(officeTiming.customDeductionAmount) < 0) {
      alert('❌ Attendance deduction cannot be negative.');
      return;
    }
    try {
      await updateAttendanceRules({
        officeStartTime: officeTiming.start,
        halfDayThreshold: officeTiming.halfDayCutoff,
        officeEndTime: officeTiming.end,
        halfDayWorkingHours: Number(officeTiming.halfDayWorkingHours),
        customDeductionAmount: Number(officeTiming.customDeductionAmount),
      });
      alert('✅ Shift settings, half-day working hours & deduction policy saved successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving shift settings');
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    try {
      await overrideAttendance(overrideModal.record._id, {
        status: overrideModal.status,
        overrideNotes: overrideModal.notes,
      });
      alert('✅ Attendance status updated manually by HR!');
      setOverrideModal({ show: false, record: null, status: 'half_day', notes: '' });
      loadAttendance();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving HR status override');
    }
  };

  const safeFormatTime = (timeData) => {
    if (!timeData) return '—';
    const val = timeData?.time || (typeof timeData === 'string' ? timeData : (timeData instanceof Date ? timeData : null));
    if (!val) return '—';
    const dt = new Date(val);
    if (isNaN(dt.getTime())) return '—';
    return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const statusBadge = {
    present: { label: '🟢 Present', style: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black' },
    late: { label: '🟢 Present (Late)', style: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black' },
    half_day: { label: '🟡 Half Day', style: 'bg-amber-100 text-amber-950 border-amber-400 font-black' },
    on_leave: { label: '🔵 Paid Leave', style: 'bg-blue-100 text-blue-900 border-blue-300 font-black' },
    unpaid_leave: { label: '🟣 Approved Leave', style: 'bg-purple-100 text-purple-950 border-purple-300 font-black' },
    absent: { label: '🔴 Absent', style: 'bg-rose-100 text-rose-950 border-rose-300 font-black' },
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Executive Header Box (Sidebar slate-900) */}
      <div className="bg-slate-900 text-white rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight uppercase flex items-center gap-2">
            <span>📅 Attendance & Shift Governance Register</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Shift: {officeTiming.start}–{officeTiming.end} · Half-Day Cutoff: {officeTiming.halfDayCutoff} · Half-Day Hours: {officeTiming.halfDayWorkingHours}h
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-black uppercase transition-all shadow cursor-pointer"
          >
            ⚙️ Shift Settings
          </button>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-black shadow focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Redesigned Responsive Shift Settings Card */}
      {showConfig && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
              <span>⚙️ Shift Timings & Attendance Policy Config</span>
            </h3>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300">
              ⚡ LIVE AUTO-CALCULATED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Column 1: Config Form Inputs */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                <div>
                  <label className="block mb-1 text-slate-700 text-[11px] uppercase font-extrabold">1. Shift Start Time</label>
                  <input
                    type="time"
                    value={officeTiming.start}
                    onChange={(e) => handleTimingChange('start', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-black text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Official reporting time</p>
                </div>
                <div>
                  <label className="block mb-1 text-slate-700 text-[11px] uppercase font-extrabold">2. Shift End Time</label>
                  <input
                    type="time"
                    value={officeTiming.end}
                    onChange={(e) => handleTimingChange('end', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-black text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Official checkout time</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                <div>
                  <label className="block mb-1 text-amber-900 text-[11px] uppercase font-extrabold">3. Half-Day Arrival Cutoff</label>
                  <input
                    type="time"
                    value={officeTiming.halfDayCutoff}
                    onChange={(e) => handleTimingChange('halfDayCutoff', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-amber-50/50 font-black text-amber-950 focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-800 mt-0.5">Arrival after cutoff = Half Day</p>
                </div>
                <div>
                  <label className="block mb-1 text-slate-700 text-[11px] uppercase font-extrabold">4. Half-Day Working Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={officeTiming.halfDayWorkingHours}
                    onChange={(e) => handleTimingChange('halfDayWorkingHours', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-black text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-indigo-700 mt-0.5">Auto-calculated (Shift / 2) & Editable</p>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-rose-900 text-[11px] uppercase font-extrabold">5. Attendance Deduction (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={officeTiming.customDeductionAmount}
                  onChange={(e) => handleTimingChange('customDeductionAmount', e.target.value)}
                  placeholder="0 (Or custom daily deduction)"
                  className="w-full px-3 py-2 rounded-lg border border-rose-300 bg-rose-50/30 font-black text-rose-950 focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-[10px] text-rose-700 mt-0.5">0 = Auto Pro-Rata Daily Rate (Negative values NOT allowed)</p>
                {Number(officeTiming.customDeductionAmount) < 0 && (
                  <p className="text-xs font-black text-rose-600 mt-1">❌ Attendance deduction cannot be negative.</p>
                )}
              </div>
            </div>

            {/* Column 2: Working Hours Live Preview & Policy Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2">📊 Shift Working Hours Live Preview</h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Working Hours</p>
                    <p className="text-base font-black text-slate-900 mt-0.5">
                      {formatDecToText(calcShiftTotalHours(officeTiming.start, officeTiming.end))}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Shift End - Shift Start</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-2xs">
                    <p className="text-[10px] font-black text-indigo-700 uppercase">Half-Day Hours</p>
                    <p className="text-base font-black text-indigo-950 mt-0.5">
                      {formatDecToText(Number(officeTiming.halfDayWorkingHours) || 0)}
                    </p>
                    <p className="text-[10px] text-indigo-500 font-bold mt-0.5">Working Hours / 2</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-700 font-bold bg-white p-3 rounded-lg border border-slate-200">
                <p className="font-extrabold text-slate-900 uppercase text-[10px] mb-1">💡 Automated Business Rules Enforcement:</p>
                <p>🟢 <strong>Present (100% Pay):</strong> Check-in ≤ Cutoff ({officeTiming.halfDayCutoff}) AND Worked ≥ {officeTiming.halfDayWorkingHours}h AND Checkout ≥ Shift End.</p>
                <p>🟡 <strong>Half Day (50% Pay):</strong> Check-in &gt; Cutoff OR Worked &lt; {officeTiming.halfDayWorkingHours}h OR Early checkout.</p>
                <p>🔵 <strong>Paid Leave:</strong> 100% Salary (No deduction).</p>
                <p>🟣 <strong>Approved Unpaid Leave / 🔴 Absent:</strong> Salary deduction according to policy.</p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveTimings}
                  disabled={Number(officeTiming.customDeductionAmount) < 0}
                  className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black uppercase transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  💾 Save Shift Policy Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Small Stat Boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-500 uppercase">Present Today</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats?.present || 0}</p>
          </div>
          <span className="text-base bg-emerald-50 text-emerald-800 p-2 rounded-lg font-black">✓</span>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-500 uppercase">Late Arrivals</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats?.late || 0}</p>
          </div>
          <span className="text-base bg-amber-50 text-amber-900 p-2 rounded-lg font-black">⏰</span>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-500 uppercase">Half-Days</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{records.filter(r => r.status === 'half_day').length}</p>
          </div>
          <span className="text-base bg-orange-50 text-orange-950 p-2 rounded-lg font-black">⛅</span>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-500 uppercase">On Leave</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats?.onLeave || 0}</p>
          </div>
          <span className="text-base bg-blue-50 text-blue-900 p-2 rounded-lg font-black">🏖️</span>
        </div>
      </div>

      {/* Quick Admin Check-In/Out Buttons Box */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
        <div className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
          <span>🕒 Quick Terminal Check-In/Out for Today</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCheckIn} className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black uppercase shadow-xs cursor-pointer">
            ✓ Mark Check-In
          </button>
          <button onClick={handleCheckOut} className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-lg text-xs font-black uppercase transition-all cursor-pointer">
            ➜ Mark Check-Out
          </button>
        </div>
      </div>

      {/* Structured Responsive Table in Slate-900 & White Theme */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-black uppercase tracking-wider border-b border-slate-800">
                  <th className="text-left py-3 px-4">Staff Member</th>
                  <th className="text-left py-3 px-4">Check-In Time</th>
                  <th className="text-left py-3 px-4">Check-Out Time</th>
                  <th className="text-left py-3 px-4">System / HR Status</th>
                  <th className="text-left py-3 px-4">HR Override Reason</th>
                  <th className="text-right py-3 px-4">Manual Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                {records.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-slate-900 font-extrabold text-sm">{record.employee?.name || 'Staff'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{record.employee?.department || 'General'}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800 font-extrabold">
                      {safeFormatTime(record.checkIn)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800 font-extrabold">
                      {safeFormatTime(record.checkOut)}
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const badge = statusBadge[record.status] || {
                          label: record.status?.replace('_', ' ') || 'Unknown',
                          style: 'bg-slate-100 text-slate-700 border-slate-300 font-black',
                        };
                        return (
                          <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border ${badge.style}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      {record.overrideNotes ? (
                        <p className="text-[11px] font-extrabold text-slate-900 bg-slate-100 p-1.5 rounded border border-slate-200">
                          📝 "{record.overrideNotes}"
                        </p>
                      ) : (
                        <span className="text-slate-300 italic text-[11px]">No manual override</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setOverrideModal({ show: true, record, status: record.status || 'half_day', notes: record.overrideNotes || '' })}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase transition-all shadow-xs cursor-pointer"
                      >
                        ✎ Edit Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {records.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-extrabold text-xs">
              No attendance logs found for {dateFilter}.
            </div>
          )}
        </div>
      )}

      {/* HR Status Override Modal in Slate/White Theme */}
      {overrideModal.show && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-300">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <h2 className="text-sm font-black uppercase tracking-wider">✎ HR Manual Attendance Override</h2>
              <button onClick={() => setOverrideModal({ show: false, record: null, status: 'half_day', notes: '' })} className="text-slate-400 hover:text-white text-sm font-black">✕</button>
            </div>
            <form onSubmit={handleOverrideSubmit} className="p-5 space-y-4 text-xs font-bold">
              <div>
                <p className="text-[11px] text-slate-500 uppercase font-black">Employee Target</p>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">{overrideModal.record?.employee?.name}</p>
              </div>
              <div>
                <label className="block mb-1.5 text-slate-700 font-black uppercase text-[11px]">Select Attendance Status *</label>
                <select
                  value={overrideModal.status}
                  onChange={(e) => setOverrideModal({ ...overrideModal, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-black text-slate-900 cursor-pointer"
                >
                  <option value="present">Present (Full Day - 1.0x Pay)</option>
                  <option value="half_day">Half Day (After 10:30am or Exit 2pm - 0.5x Pay)</option>
                  <option value="late">Late Arrival (Flagged)</option>
                  <option value="absent">Absent (Zero Pay)</option>
                  <option value="on_leave">On Approved Leave (Paid)</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-slate-700 font-black uppercase text-[11px]">Reason / Override Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={overrideModal.notes}
                  onChange={(e) => setOverrideModal({ ...overrideModal, notes: e.target.value })}
                  placeholder="e.g. Employee departed at 2:15 PM for urgent medical appointment. Marked half-day by HR."
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setOverrideModal({ show: false, record: null, status: 'half_day', notes: '' })} className="px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg uppercase text-[11px] font-black cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg uppercase text-[11px] font-black shadow cursor-pointer">Save Override</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
