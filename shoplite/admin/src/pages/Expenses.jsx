import { useState, useEffect } from 'react';
import { fetchAllExpenses, reviewExpense } from '../services/api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

/**
 * Expenses — Structured Claim & Cloudinary Attachment Register
 * Small white boxes with sidebar slate-900 headers and direct document viewing/uploading.
 */
const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [uploadingId, setUploadingId] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);

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

  useEffect(() => {
    loadExpenses();
  }, [statusFilter]);

  const handleReview = async (id, status) => {
    try {
      const notes = status === 'rejected' ? prompt('Reason for rejection (optional):') || '' : '';
      await reviewExpense(id, { status, reviewerNotes: notes });
      loadExpenses();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating expense status');
    }
  };

  const handleCloudinaryUpload = async (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingId(id);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');
      
      const cloudName = 'doxb5l56a';
      const uploadRes = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, formData);
      
      const attachmentUrl = uploadRes.data.secure_url;
      await reviewExpense(id, { attachmentUrl });
      alert('✅ Receipt Document uploaded directly to Cloudinary!');
      loadExpenses();
    } catch (error) {
      alert('Error uploading document to Cloudinary. Ensure your file format is valid.');
      console.error(error);
    } finally {
      setUploadingId(null);
    }
  };

  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const statusBadge = {
    pending: 'bg-amber-100 text-amber-950 border-amber-300 font-black',
    approved: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black',
    rejected: 'bg-rose-100 text-rose-950 border-rose-300 font-black',
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Executive Header Box (Sidebar slate-900) */}
      <div className="bg-slate-900 text-white rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight uppercase flex items-center gap-2">
            <span>📑 Expense Reimbursements & Receipt Documents</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Audit staff reimbursement claims, inspect attached Cloudinary invoices (PDF / Images), or upload verified digital vouchers.
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-black shadow focus:outline-none shrink-0 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending Audit</option>
          <option value="approved">Approved & Paid</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* 3 Small Summary Boxes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase">Total Claims Submitted</p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{expenses.length} Vouchers</p>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase">Pending HR Reimbursement</p>
          <p className="text-xl font-black text-amber-900 mt-0.5">{expenses.filter(e => e.status === 'pending').length} Awaiting Audit</p>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase">Total Disbursed Value</p>
          <p className="text-xl font-black text-emerald-950 mt-0.5">{formatINR(expenses.filter(e => e.status === 'approved').reduce((acc, curr) => acc + (curr.amount || 0), 0))}</p>
        </div>
      </div>

      {/* Structured Responsive Table in Slate/White Theme */}
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
                  <th className="text-left py-3 px-4">Claimant / Staff</th>
                  <th className="text-left py-3 px-4">Category & Purpose</th>
                  <th className="text-right py-3 px-4">Claim Amount (₹)</th>
                  <th className="text-center py-3 px-4">Cloudinary Document</th>
                  <th className="text-left py-3 px-4">Audit Status</th>
                  <th className="text-right py-3 px-4">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                {expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-slate-900 font-extrabold text-sm">{exp.employee?.name || 'Staff'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{exp.employee?.department || 'General'} · {new Date(exp.expenseDate || Date.now()).toLocaleDateString('en-IN')}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-black uppercase text-slate-800">{exp.category || 'Travel / Meals'}</p>
                      <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs">{exp.description}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-slate-900 text-sm">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {exp.attachmentUrl ? (
                          <button
                            onClick={() => setSelectedAttachment(exp.attachmentUrl)}
                            className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-extrabold text-[11px] uppercase border border-indigo-200 cursor-pointer"
                          >
                            👁️ View Doc
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No file</span>
                        )}
                        <label className="cursor-pointer px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold uppercase border border-slate-300 flex items-center gap-1">
                          <span>{uploadingId === exp._id ? '⏳...' : '☁️ Upload'}</span>
                          <input type="file" onChange={(e) => handleCloudinaryUpload(exp._id, e)} className="hidden" accept="image/*,application/pdf,.doc,.docx" disabled={uploadingId === exp._id} />
                        </label>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border ${statusBadge[exp.status] || 'bg-slate-100 text-slate-700'}`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {exp.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReview(exp._id, 'approved')}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase transition-all shadow-xs cursor-pointer"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleReview(exp._id, 'rejected')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-black text-[11px] uppercase transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {exp.status !== 'pending' && (
                        <span className="text-slate-400 font-bold text-[11px] italic">Audited</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {expenses.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-extrabold text-xs">
              No expense claims found.
            </div>
          )}
        </div>
      )}

      {/* Cloudinary Document Modal */}
      {selectedAttachment && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-400">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <span>📑 Cloudinary Attachment Viewer</span>
              </h3>
              <div className="flex items-center gap-3">
                <a href={selectedAttachment} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-300 hover:text-white font-extrabold underline">Open Full Tab ↗</a>
                <button onClick={() => setSelectedAttachment(null)} className="text-slate-400 hover:text-white font-black text-sm">✕</button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-2 flex items-center justify-center overflow-auto min-h-[500px]">
              {selectedAttachment.toLowerCase().endsWith('.pdf') ? (
                <iframe src={selectedAttachment} title="Document Viewer" className="w-full h-[600px] border border-slate-300 rounded-lg" />
              ) : (
                <img src={selectedAttachment} alt="Receipt Attachment" className="max-h-[650px] max-w-full object-contain rounded shadow-lg border border-slate-300 bg-white p-1" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
