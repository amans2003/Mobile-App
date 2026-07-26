import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchEmployeeStats,
  fetchAttendanceStats,
  fetchPayrollStats,
  fetchAllLeaves,
  fetchEmployees,
  updateEmployee,
  deleteEmployee,
} from '../services/api';

/**
 * Compact Stat Box — High-efficiency small metric card in white against slate-900 accents
 */
const SmallStatBox = ({ title, value, badge, subtext, icon }) => (
  <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-400 transition-all duration-150">
    <div className="flex items-start justify-between gap-2 mb-2">
      <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider block truncate">{title}</span>
      <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs shrink-0 font-bold">
        {icon || '■'}
      </span>
    </div>
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-slate-900 tracking-tight">{value}</span>
        {badge && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white uppercase">
            {badge}
          </span>
        )}
      </div>
      {subtext && <p className="text-[11px] font-bold text-slate-500 mt-1 truncate">{subtext}</p>}
    </div>
  </div>
);

/**
 * Dashboard — Compact, structured, responsive executive operations center
 * Strictly using sidebar slate-900 for sections and crisp white containers for data.
 */
const Dashboard = () => {
  const { user } = useAuth();
  const [empStats, setEmpStats] = useState(null);
  const [attStats, setAttStats] = useState(null);
  const [payStats, setPayStats] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [empRes, attRes, pendingRes] = await Promise.all([
        fetchEmployeeStats().catch(() => ({ data: { totalEmployees: 0, pendingCount: 0, departmentStats: [], roleStats: [] } })),
        fetchAttendanceStats().catch(() => ({ data: { present: 0, late: 0, absent: 0, onLeave: 0 } })),
        fetchEmployees({ status: 'pending_approval' }).catch(() => ({ data: [] })),
      ]);

      setEmpStats(empRes.data);
      setAttStats(attRes.data);
      setPendingEmployees(pendingRes.data || []);

      try {
        const payRes = await fetchPayrollStats();
        setPayStats(payRes.data);
      } catch (e) {}

      try {
        const leaveRes = await fetchAllLeaves({ status: 'pending' });
        setPendingLeaves(leaveRes.data?.length || 0);
      } catch (e) {}
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleApproveEmployee = async (emp) => {
    try {
      await updateEmployee(emp._id, {
        status: 'active',
        department: emp.department || 'General',
        designation: emp.designation || 'Staff Member',
      });
      alert(`✅ ${emp.name}'s account approved!`);
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving employee');
    }
  };

  const handleRejectEmployee = async (emp) => {
    if (window.confirm(`Reject and delete registration for ${emp.name}?`)) {
      try {
        await deleteEmployee(emp._id);
        loadDashboardData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error rejecting applicant');
      }
    }
  };

  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Executive Header Box (Sidebar slate-900 color) */}
      <div className="bg-slate-900 text-white rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight uppercase flex items-center gap-2">
            <span>📊 HR Executive Operations Hub</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Welcome, <strong className="text-white font-bold">{user?.name}</strong> · Active real-time surveillance of staffing, leave quotas, and pro-rata salaries.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-3.5 py-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-black uppercase transition-all shadow shrink-0 active:scale-95 cursor-pointer"
        >
          🔄 Refresh Feed
        </button>
      </div>

      {/* 4 Small Boxes - Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SmallStatBox
          title="Active Headcount"
          value={empStats?.totalEmployees || 0}
          badge={empStats?.pendingCount > 0 ? `${empStats.pendingCount} New` : null}
          subtext="Total onboarded personnel"
          icon="👥"
        />
        <SmallStatBox
          title="Present Today"
          value={attStats?.present || 0}
          subtext={`Late Arrivals: ${attStats?.late || 0}`}
          icon="✓"
        />
        <SmallStatBox
          title="Pending Leave Claims"
          value={pendingLeaves}
          badge={pendingLeaves > 0 ? 'Review' : 'Clear'}
          subtext="Awaiting manager sign-off"
          icon="🏖️"
        />
        <SmallStatBox
          title="Monthly Payroll Disbursal"
          value={payStats?.totalNet ? formatINR(payStats.totalNet) : '₹0'}
          subtext={`${payStats?.employeesProcessed || 0} payslips processed`}
          icon="₹"
        />
      </div>

      {/* 🚨 Action Required: Structured Responsive Table for Pending Onboarding */}
      {pendingEmployees.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-slate-900 shadow-md overflow-hidden">
          <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-white text-slate-900 flex items-center justify-center text-[11px]">!</span>
              <span>Pending Sign-Up Applications ({pendingEmployees.length})</span>
            </h2>
            <span className="text-[11px] font-black text-slate-300">Requires Authorization</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
                  <th className="text-left py-2 px-3.5">Applicant Name</th>
                  <th className="text-left py-2 px-3.5">Email & Phone</th>
                  <th className="text-left py-2 px-3.5">Status</th>
                  <th className="text-right py-2 px-3.5">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                {pendingEmployees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3.5 text-slate-900">{emp.name}</td>
                    <td className="py-2.5 px-3.5 text-slate-600 font-mono">{emp.email} {emp.phone && `· ${emp.phone}` || ''}</td>
                    <td className="py-2.5 px-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-black bg-amber-100 text-amber-900 border border-amber-300">
                        Pending Approval
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleApproveEmployee(emp)}
                        className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase transition-all shadow-xs cursor-pointer"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleRejectEmployee(emp)}
                        className="px-2.5 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-black text-[11px] uppercase transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Structured Department & Shortcut Small Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="bg-slate-900 text-white text-xs font-black uppercase px-3.5 py-2 rounded-lg mb-3 flex items-center justify-between">
            <span>👥 Department Distribution</span>
            <span>{empStats?.departmentStats?.length || 0} Units</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {empStats?.departmentStats?.length > 0 ? (
              empStats.departmentStats.map((dept) => (
                <div key={dept._id || 'unassigned'} className="p-3 rounded-lg border border-slate-200/80 bg-slate-50 text-center hover:bg-white transition-all">
                  <p className="text-xl font-black text-slate-900">{dept.count}</p>
                  <p className="text-[11px] font-extrabold text-slate-600 uppercase mt-0.5 truncate">{dept._id || 'General'}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-bold py-4 col-span-3 text-center">No active department allocations recorded yet.</p>
            )}
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="bg-slate-900 text-white text-xs font-black uppercase px-3.5 py-2 rounded-lg mb-3 flex items-center justify-between">
            <span>⚡ Executive Shortcuts</span>
            <span>1-Click Access</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
            {[
              { label: 'Staff Directory', sub: 'Onboard & Salaries', to: '/employees', icon: '👥' },
              { label: 'Attendance Log', sub: 'Half-Day Cutoffs', to: '/attendance', icon: '📅' },
              { label: 'Payroll Roll', sub: 'Net Take-Home (₹)', to: '/payroll', icon: '💳' },
              { label: 'Expense Claims', sub: 'Cloudinary Receipts', to: '/expenses', icon: '📑' },
            ].map(({ label, sub, to, icon }) => (
              <a
                key={to}
                href={to}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-900 hover:text-white group transition-all duration-150 shadow-2xs"
              >
                <span className="w-8 h-8 rounded-md bg-slate-100 group-hover:bg-white text-slate-900 font-black flex items-center justify-center text-sm shrink-0 transition-colors">
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 group-hover:text-white truncate transition-colors">{label}</p>
                  <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-300 truncate transition-colors">{sub}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
