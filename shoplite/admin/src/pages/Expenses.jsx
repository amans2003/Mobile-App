import { useState, useEffect } from 'react';
import { fetchAllExpenses, reviewExpense, uploadAdminExpenseDoc } from '../services/api';

/**
 * Expenses — Enterprise Admin & HR Reimbursement Hub
 * Premium responsive redesign with Cloudinary document viewer/uploader and live INR financial counters.
 */
const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await fetchAllExpenses(params);
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExpenses(); }, [statusFilter]);

  const handleReview = async (id, status) => {
    try {
      setReviewingId(id);
      const notes = status === 'rejected' ? prompt('Reason for rejection (optional):') || '' : '';
      await reviewExpense(id, { status, reviewerNotes: notes });
      loadExpenses();
    } catch (error) {
      alert(error.response?.data?.message || 'Error reviewing expense');
    } finally {
      setReviewingId(null);
    }
  };

  const handleCloudinaryUpload = async (id, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingId(id);
      const formData = new FormData();
      formData.append('receipt', file);
      const res = await uploadAdminExpenseDoc(id, formData);
      alert('☁️ Successfully uploaded document to Cloudinary & attached to claim!');
      loadExpenses();
    } catch (error) {
      alert(error.response?.data?.message || 'Error uploading file to Cloudinary');
    } finally {
      setUploadingId(null);
    }
  };

  const statusColors = {
    pending: 'bg-amber-500/15 text-amber-900 border-amber-400 font-extrabold animate-pulse shadow-sm',
    approved: 'bg-emerald-500/15 text-emerald-800 border-emerald-400 font-extrabold shadow-sm',
    rejected: 'bg-rose-500/15 text-rose-800 border-rose-300 font-bold',
    reimbursed: 'bg-blue-500/15 text-blue-800 border-blue-300 font-extrabold shadow-sm',
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Quick statistics
  const totalClaims = expenses.length;
  const pendingCount = expenses.filter((e) => e.status === 'pending').length;
  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const approvedAmount = expenses.filter((e) => e.status === 'approved' || e.status === 'reimbursed').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Premium Dark Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-2xl mb-8 border border-indigo-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-wider mb-3 border border-indigo-500/30">
              <span>💳</span> Cloudinary Document & Claim Engine
            </span>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">Corporate Expenses & Receipts</h1>
            <p className="text-slate-300 text-xs md:text-sm font-medium mt-2 max-w-2xl">
              Audit employee reimbursement claims, inspect Cloudinary receipt attachments (PDF, DOCX, Images) with 1 click, and upload replacement supporting documents directly from the admin portal.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-white/10 text-white font-black text-xs sm:text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-sm backdrop-blur-md"
            >
              <option value="" className="bg-slate-900 text-white">All Claims ({totalClaims})</option>
              <option value="pending" className="bg-slate-900 text-white">⏳ Pending Review</option>
              <option value="approved" className="bg-slate-900 text-white">✓ Approved</option>
              <option value="rejected" className="bg-slate-900 text-white">✕ Rejected</option>
              <option value="reimbursed" className="bg-slate-900 text-white">💸 Reimbursed</option>
            </select>
          </div>
        </div>

        {/* Financial Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 backdrop-blur-md">
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-wider">Total Claims</p>
            <p className="text-2xl font-black text-white mt-1">{totalClaims}</p>
          </div>
          <div className="bg-amber-500/10 rounded-2xl p-3.5 border border-amber-500/20 backdrop-blur-md">
            <p className="text-amber-300 text-[11px] font-black uppercase tracking-wider">Pending Review</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-indigo-500/10 rounded-2xl p-3.5 border border-indigo-500/20 backdrop-blur-md">
            <p className="text-indigo-300 text-[11px] font-black uppercase tracking-wider">Total Requested</p>
            <p className="text-2xl font-black text-indigo-400 mt-1">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-emerald-500/10 rounded-2xl p-3.5 border border-emerald-500/20 backdrop-blur-md">
            <p className="text-emerald-300 text-[11px] font-black uppercase tracking-wider">Approved / Reimbursed</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(approvedAmount)}</p>
          </div>
        </div>
      </div>

      {/* Responsive Cards Content Area */}
      {loading ? (
        <div className="flex justify-center items-center py-28">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {expenses.map((exp) => {
            // Determine clickable file link
            let docLink = exp.receiptUrl || '';
            if (docLink.includes('http')) {
              const urlMatch = docLink.match(/https?:\/\/[^\s)]+/);
              if (urlMatch) docLink = urlMatch[0];
            } else if (docLink && !docLink.startsWith('http') && !docLink.startsWith('[IMAGE]')) {
              docLink = `http://localhost:5001/uploads/${docLink}`;
            }

            return (
              <div key={exp._id} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-200">
                {/* Card Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-500/20 shrink-0">
                      {exp.employee?.name?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900">{exp.employee?.name}</p>
                      <p className="text-xs font-bold text-indigo-600 mt-0.5">
                        {exp.employee?.department || 'General Staff'} · <span className="text-slate-500 font-mono">ID: {exp.employee?.employeeId || 'EMP'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                    <span className="text-2xl font-black text-slate-900 bg-slate-50 px-4 py-1.5 rounded-2xl border border-slate-200 shadow-inner">
                      {formatCurrency(exp.amount)}
                    </span>
                    <span className={`inline-block px-3.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${statusColors[exp.status] || 'bg-gray-100 text-gray-700'}`}>
                      {exp.status}
                    </span>
                  </div>
                </div>

                {/* Claim Title & Justification */}
                <div className="mt-5 bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 shadow-inner">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="text-base font-black text-slate-800 flex items-center gap-2">
                      <span className="text-lg">📌</span>
                      <span>{exp.title}</span>
                    </p>
                    <span className="text-xs font-extrabold px-3 py-1 bg-white text-indigo-700 rounded-xl border border-slate-200 shadow-sm capitalize">
                      {exp.category?.replace('_', ' ') || 'General Expense'}
                    </span>
                  </div>
                  {exp.description ? (
                    <p className="text-sm text-slate-700 mt-2 leading-relaxed font-semibold italic bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                      "{exp.description}"
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-200/80 text-xs font-bold text-slate-500">
                    <span>Submitted on: <strong className="text-slate-800">{new Date(exp.expenseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></span>
                    <span>Claim Reference ID: <strong className="font-mono text-slate-700">{exp._id?.slice(-8).toUpperCase()}</strong></span>
                  </div>
                </div>

                {/* ☁️ Cloudinary Document Management & Interactive Viewer */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {docLink && (docLink.startsWith('http') || docLink.includes('uploads')) ? (
                      <a
                        href={docLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-indigo-500/25 transition-all duration-200 transform active:scale-95 cursor-pointer"
                        title="Click to view Cloudinary attachment in a new tab"
                      >
                        <span className="text-base">☁️</span>
                        <span>View Cloudinary Attachment (PDF / Image) ➔</span>
                      </a>
                    ) : exp.receiptUrl ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-800 text-xs sm:text-sm font-black border border-slate-200">
                        <span>📎 Attached: {exp.receiptUrl}</span>
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm text-slate-400 font-black italic flex items-center gap-1.5 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/60">
                        <span>ℹ️</span> No receipt document attached yet
                      </span>
                    )}
                  </div>

                  {/* Admin / HR Direct Cloudinary Uploader */}
                  <label
                    title="Upload or replace supporting document in Cloudinary"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-purple-400 hover:border-purple-600 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs sm:text-sm font-black cursor-pointer transition-all duration-200 shadow-sm self-start sm:self-auto"
                  >
                    <span className="text-base">☁️</span>
                    <span>{uploadingId === exp._id ? 'Uploading to Cloudinary...' : exp.receiptUrl ? 'Replace Doc in Cloudinary' : '+ Upload to Cloudinary'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => handleCloudinaryUpload(exp._id, e)}
                      disabled={uploadingId === exp._id}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Reviewer Notes Feedback */}
                {exp.reviewerNotes ? (
                  <div className="mt-4 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-sm">
                    <span className="text-lg">💬</span>
                    <span>Admin Review Remark: {exp.reviewerNotes}</span>
                  </div>
                ) : null}

                {/* 1-Click Approve & Reject Action Bar */}
                {exp.status === 'pending' && (
                  <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                    <button
                      onClick={() => handleReview(exp._id, 'approved')}
                      disabled={reviewingId === exp._id}
                      className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black rounded-2xl shadow-xl shadow-emerald-600/25 transition-all duration-200 transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      <span className="text-base">✓</span>
                      <span>Approve Claim</span>
                    </button>
                    <button
                      onClick={() => handleReview(exp._id, 'rejected')}
                      disabled={reviewingId === exp._id}
                      className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black rounded-2xl shadow-xl shadow-rose-600/25 transition-all duration-200 transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      <span>✕</span>
                      <span>Reject & Give Note</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {expenses.length === 0 && (
            <div className="text-center py-24 text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-xl">
              <span className="text-6xl block mb-4">📭</span>
              <p className="text-lg font-black text-slate-700">No expense claims match your filters</p>
              <p className="text-xs text-slate-400 mt-1 font-bold">Reimbursement requests submitted from the mobile app will populate this page instantly!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Expenses;
