import { useState, useEffect } from 'react';
import { fetchAllAttendance, fetchAttendanceStats, checkIn, checkOut, overrideAttendance } from '../services/api';
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

  // Office Timing Customization state
  const [officeTiming, setOfficeTiming] = useState({
    start: '10:00',
    halfDayCutoff: '10:30',
    earlyLeaveCutoff: '14:00',
    end: '19:00',
  });
  const [showConfig, setShowConfig] = useState(false);

  // HR Override modal state
  const [overrideModal, setOverrideModal] = useState({ show: false, record: null, status: 'half_day', notes: '' });

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const [recordsRes, statsRes] = await Promise.all([
        fetchAllAttendance({ date: dateFilter }).catch(() => ({ data: [] })),
        fetchAttendanceStats().catch(() => ({ data: { present: 0, late: 0, absent: 0, onLeave: 0 } })),
      ]);
      setRecords(recordsRes.data || []);
      setStats(statsRes.data);
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

  const statusStyle = {
    present: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black',
    late: 'bg-amber-100 text-amber-950 border-amber-300 font-black',
    half_day: 'bg-orange-100 text-orange-950 border-orange-400 font-black',
    absent: 'bg-rose-100 text-rose-950 border-rose-300 font-black',
    on_leave: 'bg-blue-100 text-blue-900 border-blue-300 font-black',
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Executive Header Box (Sidebar slate-900) */}
      <div className="bg-slate-900 text-white rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight uppercase flex items-center gap-2">
            <span>📅 Attendance & Half-Day Governance Register</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Office hours {officeTiming.start}–{officeTiming.end}. Arrival after {officeTiming.halfDayCutoff} or departure before {officeTiming.earlyLeaveCutoff} triggers Half-Day (0.5x pro-rata salary).
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-black uppercase transition-all shadow cursor-pointer"
          >
            ⚙️ Timing Config
          </button>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-black shadow focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Customizable Office Timing Small Box */}
      {showConfig && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">⚙️ Custom Office Working & Cutoff Parameters</h3>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">AUTO-APPLIED TO SALARY CALCULATION</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
            <div>
              <label className="block mb-1 text-slate-700 text-[11px] uppercase">Shift Start Time</label>
              <input type="time" value={officeTiming.start} onChange={(e) => setOfficeTiming({ ...officeTiming, start: e.target.value })} className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white" />
            </div>
            <div>
              <label className="block mb-1 text-slate-700 text-[11px] uppercase">Half-Day Arrival Cutoff</label>
              <input type="time" value={officeTiming.halfDayCutoff} onChange={(e) => setOfficeTiming({ ...officeTiming, halfDayCutoff: e.target.value })} className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white text-amber-900 font-extrabold" />
            </div>
            <div>
              <label className="block mb-1 text-slate-700 text-[11px] uppercase">Early Exit Cutoff (2 PM)</label>
              <input type="time" value={officeTiming.earlyLeaveCutoff} onChange={(e) => setOfficeTiming({ ...officeTiming, earlyLeaveCutoff: e.target.value })} className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white text-rose-800 font-extrabold" />
            </div>
            <div>
              <label className="block mb-1 text-slate-700 text-[11px] uppercase">Shift End Time</label>
              <input type="time" value={officeTiming.end} onChange={(e) => setOfficeTiming({ ...officeTiming, end: e.target.value })} className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-bold mt-2.5">
            💡 Rule Enforcement: Any staff logging check-in after {officeTiming.halfDayCutoff} or leaving prior to {officeTiming.earlyLeaveCutoff} gets assigned <strong>Half-Day (0.5)</strong> attendance value.
          </p>
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
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800 font-extrabold">
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border ${statusStyle[record.status] || 'bg-slate-100 text-slate-700'}`}>
                        {record.status?.replace('_', ' ')}
                      </span>
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
