import { useState, useEffect } from 'react';
import { generatePayroll, fetchPayrollRecords, fetchPayrollStats } from '../services/api';

/**
 * Payroll — Monthly salary processing & disbursement dashboard
 * Breathtaking redesign with responsive statistical displays, detailed attendance deductions, and take-home highlights.
 */
const Payroll = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsRes, statsRes] = await Promise.all([
        fetchPayrollRecords({ month: selectedMonth, year: selectedYear }),
        fetchPayrollStats({ month: selectedMonth, year: selectedYear }),
      ]);
      setRecords(recordsRes.data || []);
      setStats(statsRes.data || null);
    } catch (error) {
      console.error('Error loading payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedMonth, selectedYear]);

  const handleGenerate = async () => {
    if (!window.confirm(`Generate payroll for ${selectedMonth}/${selectedYear}? This will automatically compute pro-rata salaries based on half-day rules and attendance records for all active staff.`)) return;
    try {
      setGenerating(true);
      await generatePayroll({ month: selectedMonth, year: selectedYear });
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error generating payroll');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 md:p-8 text-white shadow-2xl mb-8 border border-emerald-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider mb-3 border border-emerald-500/30">
              <span>💳</span> Automated Pro-Rata Salary Engine
            </span>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">Payroll & Net Disbursements</h1>
            <p className="text-slate-300 text-xs md:text-sm font-medium mt-2 max-w-2xl">
              Process monthly employee compensation with automated deductions for unpaid absences, half-days (0.5 credit), tax, and provident fund contributions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-3 rounded-2xl bg-white/10 text-white font-black text-xs sm:text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer backdrop-blur-md"
            >
              {months.map((m, i) => <option key={i} value={i + 1} className="bg-slate-900 text-white">{m}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-3 rounded-2xl bg-white/10 text-white font-black text-xs sm:text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer backdrop-blur-md"
            >
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>)}
            </select>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span className="text-lg">⚡</span>
              <span>{generating ? 'Processing Salaries...' : 'Generate Month Payroll'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Statistical Financial Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-indigo-800/60 transform hover:-translate-y-0.5 transition-all">
            <p className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center justify-between">
              <span>Staff Processed</span>
              <span className="text-xl">👥</span>
            </p>
            <p className="text-3xl sm:text-4xl font-black text-white mt-3">{stats.employeesProcessed || 0}</p>
            <p className="text-xs text-slate-400 font-bold mt-1">For {months[selectedMonth - 1]} {selectedYear}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-emerald-600/60 transform hover:-translate-y-0.5 transition-all">
            <p className="text-xs font-black text-emerald-200 uppercase tracking-wider flex items-center justify-between">
              <span>Total Gross Salary</span>
              <span className="text-xl">📈</span>
            </p>
            <p className="text-3xl sm:text-4xl font-black text-emerald-300 mt-3">{formatCurrency(stats.totalGross || 0)}</p>
            <p className="text-xs text-emerald-100 font-bold mt-1">Before tax & absence deductions</p>
          </div>
          <div className="bg-gradient-to-br from-rose-800 via-red-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-rose-700/60 transform hover:-translate-y-0.5 transition-all">
            <p className="text-xs font-black text-rose-200 uppercase tracking-wider flex items-center justify-between">
              <span>Total Deducted Money</span>
              <span className="text-xl">🔻</span>
            </p>
            <p className="text-3xl sm:text-4xl font-black text-rose-300 mt-3">{formatCurrency(stats.totalDeductions || 0)}</p>
            <p className="text-xs text-rose-100 font-bold mt-1">Absences, taxes & insurance</p>
          </div>
          <div className="bg-gradient-to-br from-teal-600 via-emerald-600 to-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/15 border border-teal-400/60 transform hover:-translate-y-0.5 transition-all">
            <p className="text-xs font-black text-teal-100 uppercase tracking-wider flex items-center justify-between">
              <span>Net Take-Home Pay</span>
              <span className="text-xl">💰</span>
            </p>
            <p className="text-3xl sm:text-4xl font-black text-white mt-3">{formatCurrency(stats.totalNet || 0)}</p>
            <p className="text-xs text-emerald-100 font-bold mt-1">Final disbursement total</p>
          </div>
        </div>
      )}

      {/* Responsive Payroll Table Register */}
      {loading ? (
        <div className="flex justify-center items-center py-28">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/75 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📑</span>
              <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider">
                Monthly Salary Disbursement Roll ({months[selectedMonth - 1]} {selectedYear})
              </h3>
            </div>
            <span className="text-xs font-extrabold bg-emerald-100 text-emerald-950 px-3.5 py-1.5 rounded-full shadow-inner self-start sm:self-auto">
              ✓ Synchronized with Employee Phone App Payslips
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-100/60">
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-wider">Staff Member</th>
                  <th className="text-center px-6 py-4 text-xs font-black text-indigo-950 uppercase tracking-wider bg-indigo-50/70">Attendance & Days Present</th>
                  <th className="text-right px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-wider">Gross Pay</th>
                  <th className="text-right px-6 py-4 text-xs font-black text-rose-800 uppercase tracking-wider">Money Deducted</th>
                  <th className="text-right px-6 py-4 text-xs font-black text-emerald-950 uppercase tracking-wider bg-emerald-50/70">Total Getting (Net Take-Home)</th>
                  <th className="text-center px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/80 transition-all duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-emerald-600 to-slate-900 flex items-center justify-center text-white text-base font-black shadow-md">
                          {rec.employee?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{rec.employee?.name}</p>
                          <p className="text-xs font-bold text-indigo-600">{rec.employee?.department || 'Staff'} · <span className="text-slate-500 font-medium">Basic: {formatCurrency(rec.basic)}</span></p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center bg-indigo-50/30">
                      <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-950 font-black text-xs shadow-inner border border-emerald-300">
                        <span>✓ Present:</span> {rec.presentDays ?? 0} / {rec.workingDays ?? 26} Days
                      </span>
                      {rec.unpaidLeaveDays > 0 ? (
                        <p className="text-[11px] font-black text-rose-700 mt-1.5 bg-rose-50 px-2 py-0.5 rounded-md inline-block border border-rose-200">
                          ⚠️ {rec.unpaidLeaveDays} Unpaid Absent Day(s) (-{formatCurrency(rec.unpaidLeaveDeduction || 0)})
                        </p>
                      ) : (
                        <p className="text-[11px] font-black text-emerald-700 mt-1.5">✓ 100% Attendance Credit</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-800">{formatCurrency(rec.grossSalary)}</span>
                      <span className="block text-[10px] text-slate-400 font-bold">Incl. allowances</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-rose-600">-{formatCurrency(rec.totalDeductions || 0)}</span>
                      {rec.unpaidLeaveDeduction > 0 && (
                        <span className="block text-[11px] font-extrabold text-rose-500">
                          (Incl. {formatCurrency(rec.unpaidLeaveDeduction)} absent pay)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right bg-emerald-50/40">
                      <span className="text-lg font-black text-emerald-950 bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-2 rounded-2xl border-2 border-emerald-400 shadow-sm inline-block">
                        {formatCurrency(rec.netSalary)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${
                        rec.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm' : 
                        rec.status === 'processed' ? 'bg-indigo-100 text-indigo-900 border-indigo-300 shadow-sm' : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {records.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <span className="text-5xl block mb-3">📭</span>
              <p className="text-base font-bold text-slate-600">No payroll records for {months[selectedMonth - 1]} {selectedYear}</p>
              <p className="text-xs text-slate-400 mt-1">Click the "⚡ Generate Month Payroll" button above to process salaries instantly!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Payroll;
