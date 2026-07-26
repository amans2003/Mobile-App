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
 * StatCard — Reusable dashboard metric card
 */
const StatCard = ({ title, value, icon, gradient, subtitle }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient}`}>
        {icon}
      </div>
    </div>
  </div>
);

/**
 * Dashboard — Enterprise HRIS Main Dashboard
 * Displays pending onboarding approval queue directly on landing along with key operational metrics
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
        setPendingLeaves(leaveRes.data.length);
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
        department: emp.department || 'General Staff',
        designation: emp.designation || 'Staff Member',
      });
      alert(`✅ ${emp.name}'s employee account has been approved and activated!`);
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving employee');
    }
  };

  const handleRejectEmployee = async (emp) => {
    if (window.confirm(`Are you sure you want to reject and delete the registration request from ${emp.name}?`)) {
      try {
        await deleteEmployee(emp._id);
        loadDashboardData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error rejecting applicant');
      }
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here is your live HR and operational overview today</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
        >
          🔄 Refresh Dashboard
        </button>
      </div>

      {/* 🚨 Immediate HR Action: Pending Employee Onboarding Queue */}
      {pendingEmployees.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-400 rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🚨</span>
            <div className="flex-1">
              <h2 className="text-xl font-extrabold text-amber-950 flex items-center gap-2">
                Pending Employee Sign-Ups Awaiting Approval
                <span className="px-2.5 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full animate-bounce">
                  {pendingEmployees.length} New
                </span>
              </h2>
              <p className="text-sm text-amber-800 font-medium">
                These team members registered through the mobile app. Approve their applications so they can log in and record attendance.
              </p>
            </div>
            <a
              href="/employees"
              className="text-xs font-bold text-indigo-700 hover:underline bg-white px-3 py-1.5 rounded-lg shadow-sm border border-indigo-100"
            >
              View Directory →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
            {pendingEmployees.map((emp) => (
              <div key={emp._id} className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900 text-base">{emp.name}</span>
                    <span className="px-2.5 py-0.5 text-[11px] font-extrabold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                      Pending HR Review
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                    <span>📧</span> {emp.email}
                  </p>
                  <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                    <span>📱</span> {emp.phone || 'No phone provided'}
                  </p>
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleApproveEmployee(emp)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>✓</span> Approve & Activate
                  </button>
                  <button
                    onClick={() => handleRejectEmployee(emp)}
                    className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-lg transition-colors border border-red-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Headcount"
          value={empStats?.totalEmployees || 0}
          subtitle={empStats?.pendingCount > 0 ? `${empStats.pendingCount} awaiting review` : "All accounts verified"}
          gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          title="Present Today"
          value={attStats?.present || 0}
          subtitle={`${attStats?.late || 0} late arrivals`}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Pending Leave Requests"
          value={pendingLeaves}
          subtitle="Awaiting HR review"
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          title="Monthly Payroll"
          value={payStats?.totalNet ? `₹${(payStats.totalNet / 100000).toFixed(1)}L` : '—'}
          subtitle={payStats?.employeesProcessed ? `${payStats.employeesProcessed} employees processed` : 'Not processed yet'}
          gradient="bg-gradient-to-br from-pink-500 to-rose-600"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Department Breakdown */}
      {empStats?.departmentStats?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Headcount Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {empStats.departmentStats.map((dept) => (
              <div key={dept._id || 'unassigned'} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <p className="text-2xl font-bold text-indigo-600">{dept.count}</p>
                <p className="text-sm font-medium text-gray-700 mt-1">{dept._id || 'General Staff'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Shortcuts</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/employees" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            <span className="text-sm font-medium text-indigo-700">Staff Directory</span>
          </a>
          <a href="/attendance" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            <span className="text-sm font-medium text-emerald-700">Attendance Log</span>
          </a>
          <a href="/leaves" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm font-medium text-amber-700">Review Leaves</span>
          </a>
          <a href="/announcements" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            <span className="text-sm font-medium text-purple-700">Post Announcement</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
