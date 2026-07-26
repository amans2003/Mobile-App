import { useState, useEffect } from 'react';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Employees — Enterprise Staff Governance & Compensation Hub
 * Features responsive table/cards, zero-arrow manual salary typing, and live leave quota assignment.
 */
const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'employee',
    department: '', designation: '', address: '', status: 'active',
    salary: { basic: '', hra: '', transport: '', medical: '', special: '', deductions: { tax: '', insurance: '', providentFund: '' } },
    leaveBalances: { pto: '20', sick: '10', casual: '7' },
  });

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await fetchEmployees(params);
      setEmployees(res.data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { loadEmployees(); }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure numerical conversion before submitting
      const cleanSalary = {
        basic: Number(form.salary.basic || 0),
        hra: Number(form.salary.hra || 0),
        transport: Number(form.salary.transport || 0),
        medical: Number(form.salary.medical || 0),
        special: Number(form.salary.special || 0),
        deductions: {
          tax: Number(form.salary.deductions?.tax || 0),
          insurance: Number(form.salary.deductions?.insurance || 0),
          providentFund: Number(form.salary.deductions?.providentFund || 0),
        }
      };
      const cleanLeaves = {
        pto: Number(form.leaveBalances?.pto ?? 20),
        sick: Number(form.leaveBalances?.sick ?? 10),
        casual: Number(form.leaveBalances?.casual ?? 7),
      };

      if (editingEmployee) {
        const updateData = { ...form, salary: cleanSalary, leaveBalances: cleanLeaves };
        if (!updateData.password) delete updateData.password;
        await updateEmployee(editingEmployee._id, updateData);
        alert('✅ Employee record and salary package updated successfully!');
      } else {
        await createEmployee({ ...form, salary: cleanSalary, leaveBalances: cleanLeaves });
        alert('✅ New employee onboarded successfully!');
      }
      setShowModal(false);
      setEditingEmployee(null);
      resetForm();
      loadEmployees();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving employee details');
    }
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setForm({
      name: emp.name || '', email: emp.email || '', password: '', phone: emp.phone || '',
      role: emp.role || 'employee', department: emp.department || '', designation: emp.designation || '',
      address: emp.address || '', status: emp.status || 'active',
      salary: {
        basic: emp.salary?.basic ?? '',
        hra: emp.salary?.hra ?? '',
        transport: emp.salary?.transport ?? '',
        medical: emp.salary?.medical ?? '',
        special: emp.salary?.special ?? '',
        deductions: {
          tax: emp.salary?.deductions?.tax ?? '',
          insurance: emp.salary?.deductions?.insurance ?? '',
          providentFund: emp.salary?.deductions?.providentFund ?? '',
        }
      },
      leaveBalances: {
        pto: emp.leaveBalances?.pto ?? '20',
        sick: emp.leaveBalances?.sick ?? '10',
        casual: emp.leaveBalances?.casual ?? '7',
      },
    });
    setShowModal(true);
  };

  const handleApprove = async (emp) => {
    try {
      await updateEmployee(emp._id, { status: 'active', department: emp.department || 'General', designation: emp.designation || 'Staff Member' });
      alert(`✅ ${emp.name}'s sign-up registration approved and account activated!`);
      loadEmployees();
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving staff member');
    }
  };

  const handleDelete = async (emp) => {
    const isPending = emp.status === 'pending_approval';
    const msg = isPending
      ? `Reject and delete registration request for ${emp.name}?`
      : `Are you sure you want to deactivate ${emp.name}?`;
    if (window.confirm(msg)) {
      try {
        await deleteEmployee(emp._id);
        loadEmployees();
      } catch (error) {
        alert(error.response?.data?.message || 'Error completing operation');
      }
    }
  };

  const resetForm = () => {
    setForm({
      name: '', email: '', password: '', phone: '', role: 'employee',
      department: '', designation: '', address: '', status: 'active',
      salary: { basic: '', hra: '', transport: '', medical: '', special: '', deductions: { tax: '', insurance: '', providentFund: '' } },
      leaveBalances: { pto: '20', sick: '10', casual: '7' },
    });
  };

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = 'Shop#';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, password: pass }));
  };

  const roleColors = {
    super_admin: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold',
    hr_manager: 'bg-purple-100 text-purple-800 border-purple-300 font-extrabold',
    finance_officer: 'bg-blue-100 text-blue-800 border-blue-300 font-extrabold',
    department_manager: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
    employee: 'bg-slate-100 text-slate-700 border-slate-300 font-bold',
  };

  const statusColors = {
    active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    pending_approval: 'bg-amber-500/15 text-amber-800 border-amber-500/40 animate-pulse',
    on_leave: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
    terminated: 'bg-rose-500/10 text-rose-700 border-rose-500/30',
    resigned: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
  };

  // Quick stats calculations
  const totalCount = employees.length;
  const pendingCount = employees.filter((e) => e.status === 'pending_approval').length;
  const activeCount = employees.filter((e) => e.status === 'active').length;
  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))].length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-2xl mb-8 border border-slate-800/80">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-wider mb-3 border border-indigo-500/30">
              <span>👥</span> Staff Directory & Compensation Hub
            </span>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">Staff & Payroll Management</h1>
            <p className="text-slate-300 text-xs md:text-sm font-medium mt-2 max-w-xl">
              Onboard employees, govern role permissions, set annual leave quotas, and manually assign monthly compensation without cumbersome stepper buttons.
            </p>
          </div>
          <button
            onClick={() => { setEditingEmployee(null); resetForm(); setShowModal(true); }}
            className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs md:text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
          >
            <span className="text-lg">＋</span>
            <span>Onboard New Staff</span>
          </button>
        </div>

        {/* Dynamic Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 backdrop-blur-md">
            <p className="text-slate-400 text-xs font-bold uppercase">Total Workforce</p>
            <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
          </div>
          <div className="bg-emerald-500/10 rounded-2xl p-3 border border-emerald-500/20 backdrop-blur-md">
            <p className="text-emerald-300 text-xs font-bold uppercase">Active Staff</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="bg-amber-500/10 rounded-2xl p-3 border border-amber-500/20 backdrop-blur-md">
            <p className="text-amber-300 text-xs font-bold uppercase">Pending Approval</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-indigo-500/10 rounded-2xl p-3 border border-indigo-500/20 backdrop-blur-md">
            <p className="text-indigo-300 text-xs font-bold uppercase">Departments</p>
            <p className="text-2xl font-black text-indigo-400 mt-1">{departments}</p>
          </div>
        </div>
      </div>

      {/* Pending Onboarding Queue Alert */}
      {pendingCount > 0 && (
        <div className="mb-8 p-5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400/80 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 text-xl font-bold">
              ⏳
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-amber-950">Action Required: {pendingCount} Pending Sign-Up Requests</h3>
              <p className="text-xs text-amber-800 font-bold">New users have registered from the mobile app and are waiting for your administrative authorization.</p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter(statusFilter === 'pending_approval' ? '' : 'pending_approval')}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-colors shadow-sm cursor-pointer"
          >
            {statusFilter === 'pending_approval' ? 'Show All Staff' : 'Review Pending Queue ➔'}
          </button>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row gap-3.5 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
          <input
            type="text"
            placeholder="Search by staff name, email, ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-extrabold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="employee">Employee</option>
            <option value="hr_manager">HR Manager</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-extrabold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Staff</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="on_leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Responsive Employees Directory Table */}
      {loading ? (
        <div className="flex justify-center items-center py-28">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75">
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-wider">Staff Member</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-wider">Department & Quota</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-wider">Account Status</th>
                  <th className="text-right px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-wider">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/80 transition-all duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-md ${emp.status === 'pending_approval' ? 'bg-amber-500 animate-pulse' : 'bg-gradient-to-br from-indigo-600 to-slate-900'}`}>
                          {emp.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <span>{emp.name}</span>
                            {emp.role === 'super_admin' && <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-md border border-amber-300">ADMIN</span>}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">{emp.email} · <strong className="text-slate-700 font-mono">ID: {emp.employeeId || 'New'}</strong></p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{emp.department || 'General'} ({emp.designation || 'Staff Member'})</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] uppercase border ${roleColors[emp.role] || 'bg-gray-100 text-gray-700'}`}>
                          {emp.role?.replace('_', ' ')}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-950 text-[11px] font-black border border-emerald-300 shadow-inner" title="Annual Assigned Paid & Sick Leave Quota">
                          <span>🏖️ Quota:</span> {emp.leaveBalances?.pto || 20} Paid / {emp.leaveBalances?.sick || 10} Sick
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase border ${statusColors[emp.status] || 'bg-gray-100 text-gray-700'}`}>
                        {emp.status === 'pending_approval' ? '⏳ PENDING APPROVAL' : emp.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {user?.role === 'hr_manager' && ['hr_manager', 'super_admin'].includes(emp.role) ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-black border border-slate-300 shadow-sm" title="Only a Super Admin can modify or deactivate HR and Admin executive accounts">
                          <span>🔒 Super Admin Protected</span>
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-2 justify-end">
                          {emp.status === 'pending_approval' && (
                            <button
                              onClick={() => handleApprove(emp)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                            >
                              ✓ Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(emp)}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 transition-all shadow-sm cursor-pointer"
                          >
                            ✎ Edit / Salary
                          </button>
                          <button
                            onClick={() => handleDelete(emp)}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition-all shadow-sm cursor-pointer"
                          >
                            {emp.status === 'pending_approval' ? 'Reject' : 'Deactivate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {employees.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <span className="text-5xl block mb-3">📁</span>
              <p className="text-base font-bold text-slate-600">No staff accounts matched your filters</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting your search query or onboard a new employee!</p>
            </div>
          )}
        </div>
      )}

      {/* ✎ Onboard / Edit Staff Modal (ZERO UP/DOWN ARROW SALARY TYPING) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-lg font-black border border-indigo-500/30">
                  {editingEmployee ? '✎' : '＋'}
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black">
                    {editingEmployee ? `Edit Staff Profile: ${editingEmployee.name}` : 'Onboard New Staff Member'}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Configure profile credentials, manual numerical salary (no stepper arrows), and leave balance allocation.
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowModal(false); setEditingEmployee(null); }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 overflow-y-auto grow">
              {/* Section 1: Profile & Credentials */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wider mb-4 flex items-center gap-2">
                  <span>👤</span> 1. Core Profile & Login Credentials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Email Address (Login) *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={!!editingEmployee}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-black text-slate-700">
                        {editingEmployee ? 'Reset Password' : 'Login Password *'}
                      </label>
                      <button
                        type="button"
                        onClick={generateStrongPassword}
                        className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md hover:bg-indigo-200 transition-colors"
                      >
                        🎲 Generate
                      </button>
                    </div>
                    <input
                      type="text"
                      required={!editingEmployee}
                      placeholder={editingEmployee ? "Leave blank to keep unchanged" : "Enter or generate password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Engineering / Sales"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Frontend Engineer"
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Role Permission</label>
                    {user?.role === 'hr_manager' ? (
                      <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-sm text-slate-700 font-bold flex items-center justify-between" title="Only Super Admin can appoint HR and Admin roles">
                        <span>👤 Employee (App Only)</span>
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-black border border-amber-300">Super Admin Needed</span>
                      </div>
                    ) : (
                      <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-black text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="employee">👤 Employee (Mobile App Only)</option>
                        <option value="hr_manager">👥 HR Manager (Portal + App)</option>
                        <option value="super_admin">🛡️ Super Admin (Full Portal & App)</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Account Status</label>
                    <select
                      value={form.status || 'active'}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-black text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="active">🟢 Active (Can Login)</option>
                      <option value="pending_approval">⏳ Pending Approval (Blocked)</option>
                      <option value="on_leave">🏖️ On Leave</option>
                      <option value="terminated">🔴 Terminated (Blocked)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Zero-Arrow Manual Salary Package */}
              <div className="bg-emerald-50/60 p-5 rounded-2xl border-2 border-emerald-300 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                    <span>💸</span> 2. Monthly Salary Structure (₹ Manual Typing - No Up/Down Arrows)
                  </h3>
                  <span className="text-[10px] font-black bg-emerald-200 text-emerald-950 px-3 py-1 rounded-full shadow-inner">
                    Pure manual typing enabled
                  </span>
                </div>

                {/* Earnings Grid */}
                <p className="text-[11px] font-black text-emerald-800 mb-2 uppercase">Monthly Earnings & Allowances (₹)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 mb-5">
                  {[
                    { key: 'basic', label: 'Basic Pay *' },
                    { key: 'hra', label: 'HRA' },
                    { key: 'transport', label: 'Transport' },
                    { key: 'medical', label: 'Medical' },
                    { key: 'special', label: 'Special' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-black text-slate-700 mb-1">{label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₹</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="0"
                          value={form.salary[key] ?? ''}
                          onChange={(e) => {
                            // Only allow pure digits when manually typing
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setForm({ ...form, salary: { ...form.salary, [key]: val } });
                          }}
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-emerald-300 bg-white font-black text-sm text-emerald-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Deductions Grid */}
                <p className="text-[11px] font-black text-rose-800 mb-2 uppercase border-t border-emerald-200 pt-3">Standard Monthly Deductions (₹)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {[
                    { key: 'tax', label: 'Tax Deduction' },
                    { key: 'insurance', label: 'Health Insurance' },
                    { key: 'providentFund', label: 'Provident Fund (PF)' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-black text-rose-900 mb-1">{label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-black text-sm">₹</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="0"
                          value={form.salary.deductions?.[key] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setForm({
                              ...form,
                              salary: {
                                ...form.salary,
                                deductions: { ...form.salary.deductions, [key]: val }
                              }
                            });
                          }}
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-rose-300 bg-white font-black text-sm text-rose-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Leave Quota Allocation */}
              <div className="bg-indigo-50/70 p-5 rounded-2xl border-2 border-indigo-200 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs sm:text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <span>🏖️</span> 3. Annual Leave & Sick Leave Allocation (Days / Year)
                  </h3>
                  <span className="text-[10px] font-black bg-indigo-200 text-indigo-950 px-3 py-1 rounded-full shadow-inner">
                    Synced with Employee Mobile App
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-indigo-950 mb-1">Paid / PTO Leaves (Days)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.leaveBalances?.pto ?? '20'}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setForm({ ...form, leaveBalances: { ...form.leaveBalances, pto: val } });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 bg-white font-black text-sm text-indigo-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-indigo-950 mb-1">Sick Leaves (Days)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.leaveBalances?.sick ?? '10'}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setForm({ ...form, leaveBalances: { ...form.leaveBalances, sick: val } });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 bg-white font-black text-sm text-rose-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-indigo-950 mb-1">Casual Leaves (Days)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.leaveBalances?.casual ?? '7'}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setForm({ ...form, leaveBalances: { ...form.leaveBalances, casual: val } });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 bg-white font-black text-sm text-emerald-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingEmployee(null); }}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 hover:opacity-90 text-white font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-indigo-500/25 transition-all transform active:scale-95 cursor-pointer"
                >
                  {editingEmployee ? '✓ Save Profile & Manual Salary' : '＋ Onboard Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
