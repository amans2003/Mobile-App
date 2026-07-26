import { useState, useEffect } from 'react';
import { fetchAllLeaves, reviewLeave } from '../services/api';

/**
 * Leaves — Leave request management with approve/reject workflow
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
      setLeaves(data);
    } catch (error) {
      console.error('Error loading leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeaves(); }, [statusFilter]);

  const handleReview = async (id, status) => {
    try {
      setReviewingId(id);
      const notes = status === 'rejected' ? prompt('Reason for rejection (optional):') || '' : '';
      await reviewLeave(id, { status, reviewerNotes: notes });
      loadLeaves();
    } catch (error) {
      alert(error.response?.data?.message || 'Error reviewing leave');
    } finally {
      setReviewingId(null);
    }
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  const leaveTypeLabels = {
    pto: 'Paid Time Off', sick: 'Sick Leave', casual: 'Casual Leave',
    maternity: 'Maternity', paternity: 'Paternity', unpaid: 'Unpaid', compensatory: 'Comp Off',
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-sm text-gray-500">Review and manage employee time-off requests</p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <div key={leave._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {leave.employee?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{leave.employee?.name}</p>
                    <p className="text-xs text-gray-400">{leave.employee?.department} · {leave.employee?.employeeId}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[leave.status]}`}>
                  {leave.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Type</p>
                  <p className="text-sm font-medium text-gray-700">{leaveTypeLabels[leave.leaveType] || leave.leaveType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">From</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(leave.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">To</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(leave.endDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Duration</p>
                  <p className="text-sm font-medium text-gray-700">{leave.totalDays} day(s)</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-400">Reason</p>
                <p className="text-sm text-gray-600">{leave.reason}</p>
              </div>

              {leave.status === 'pending' && (
                <div className="mt-4 flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleReview(leave._id, 'approved')}
                    disabled={reviewingId === leave._id}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReview(leave._id, 'rejected')}
                    disabled={reviewingId === leave._id}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    ✗ Reject
                  </button>
                </div>
              )}

              {leave.reviewedBy && (
                <p className="text-xs text-gray-400 mt-3">
                  Reviewed by {leave.reviewedBy?.name} {leave.reviewerNotes ? `— "${leave.reviewerNotes}"` : ''}
                </p>
              )}
            </div>
          ))}

          {leaves.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              No leave requests found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaves;
