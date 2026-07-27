import { useState, useEffect } from 'react';
import { fetchAllLeaves, reviewLeave } from '../services/api';

/**
 * Leaves — Structured Leave Management & Quota Auditing Register
 * Executive small white boxes with sidebar slate-900 headers and responsive layout.
 */
const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewingId, setReviewingId] = useState(null);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await fetchAllLeaves(params);
      setLeaves(data || []);
    } catch (error) {
      console.error('Error loading leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeaves(); }, [statusFilter]);

  const handleReview = async (id, status, approvalType = 'full_day') => {
    try {
      setReviewingId(id);
      const notes = status === 'rejected' ? prompt('Reason for rejection (optional):') || '' : '';
      await reviewLeave(id, { status, reviewerNotes: notes, approvalType });
      loadLeaves();
    } catch (error) {
      alert(error.response?.data?.message || 'Error reviewing leave');
    } finally {
      setReviewingId(null);
    }
  };

  const statusBadge = {
    pending: 'bg-amber-100 text-amber-950 border-amber-400 font-black',
    approved: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black',
    rejected: 'bg-rose-100 text-rose-950 border-rose-300 font-black',
    cancelled: 'bg-slate-100 text-slate-700 border-slate-300 font-black',
  };

  const leaveTypeLabels = {
    pto: 'Paid Time Off', sick: 'Sick Leave', casual: 'Casual Leave',
    maternity: 'Maternity', paternity: 'Paternity', unpaid: 'Unpaid', compensatory: 'Comp Off',
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Executive Header Box (Sidebar slate-900) */}
      <div className="bg-slate-900 text-white rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight uppercase flex items-center gap-2">
            <span>🏖️ Leave Requests & Quota Auditing Register</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Audit staff time-off requests. Approved paid days are protected in payroll; unapproved or unpaid leave gets deducted.
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-black shadow focus:outline-none shrink-0 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* 3 Small Summary Boxes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase">Total Applications</p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{leaves.length} Claims</p>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase">Pending HR Review</p>
          <p className="text-xl font-black text-amber-900 mt-0.5">{leaves.filter(l => l.status === 'pending').length} Action Needed</p>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase">Approved Leaves</p>
          <p className="text-xl font-black text-emerald-950 mt-0.5">{leaves.filter(l => l.status === 'approved').length} Verified</p>
        </div>
      </div>

      {/* Structured Responsive Table in Slate-900/White Theme */}
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
                  <th className="text-left py-3 px-4">Employee Member</th>
                  <th className="text-left py-3 px-4">Leave Category</th>
                  <th className="text-left py-3 px-4">Duration Range</th>
                  <th className="text-left py-3 px-4">Reason & Notes</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                {leaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-slate-900 font-extrabold text-sm">{l.employee?.name || 'Staff'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{l.employee?.department || 'General'} · ID: {l.employee?.employeeId || 'STAFF'}</p>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 uppercase text-xs">
                      {leaveTypeLabels[l.leaveType] || l.leaveType}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-extrabold font-mono">
                      <span>{formatDate(l.startDate)} ➜ {formatDate(l.endDate)}</span>
                      <span className="block text-[11px] text-indigo-900 font-black">({l.totalDays} day{l.totalDays !== 1 ? 's' : ''})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium max-w-xs truncate">
                      "{l.reason}"
                      {l.reviewerNotes && <p className="text-[10px] font-bold text-slate-500 mt-0.5">HR Note: {l.reviewerNotes}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border ${statusBadge[l.status] || 'bg-slate-100 text-slate-700'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {l.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleReview(l._id, 'approved', 'full_day')}
                            disabled={reviewingId === l._id}
                            title="Approve full day leave"
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-black text-[10px] uppercase transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            ✓ Approve (Full)
                          </button>
                          <button
                            onClick={() => handleReview(l._id, 'approved', 'half_day')}
                            disabled={reviewingId === l._id}
                            title="Approve as half-day with automatic check-out and 50% salary deduction if no quota left"
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] uppercase transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            ⛅ Half-Day (Auto-Exit)
                          </button>
                          <button
                            onClick={() => handleReview(l._id, 'rejected', null)}
                            disabled={reviewingId === l._id}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-black text-[10px] uppercase transition-all cursor-pointer disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-slate-400 font-bold text-[11px] italic block">Reviewed by HR</span>
                          {l.approvalType === 'half_day' && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 font-black text-[9px] uppercase rounded">
                              ⛅ Half-Day Check-Out
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {leaves.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-extrabold text-xs">
              No leave requests matching your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaves;
