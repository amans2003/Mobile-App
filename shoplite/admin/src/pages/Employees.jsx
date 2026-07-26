import { useState, useEffect } from 'react';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Employees — Structured Executive Staff & Salary Management
 * Uses sidebar slate-900 for headers and crisp white small boxes for data tables and controls.
 * Includes zero-arrow manual salary numerical text input.
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
    const timer = setTimeout(() => { loadEmployees(); }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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
        alert('✅ Staff record & manual compensation package updated!');
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
        basic: String(emp.salary?.basic ?? ''),
        hra: String(emp.salary?.hra ?? ''),
        transport: String(emp.salary?.transport ?? ''),
        medical: String(emp.salary?.medical ?? ''),
        special: String(emp.salary?.special ?? ''),
        deductions: {
          tax: String(emp.salary?.deductions?.tax ?? ''),
          insurance: String(emp.salary?.deductions?.insurance ?? ''),
          providentFund: String(emp.salary?.deductions?.providentFund ?? ''),
        }
      },
      leaveBalances: {
        pto: String(emp.leaveBalances?.pto ?? '20'),
        sick: String(emp.leaveBalances?.sick ?? '10'),
        casual: String(emp.leaveBalances?.casual ?? '7'),
      },
    });
    setShowModal(true);
  };

  const handleApprove = async (emp) => {
    try {
      await updateEmployee(emp._id, { status: 'active', department: emp.department || 'General', designation: emp.designation || 'Staff Member' });
      alert(`✅ ${emp.name}'s registration authorized!`);
      loadEmployees();
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving staff member');
    }
  };

  const handleDelete = async (emp) => {
    const isPending = emp.status === 'pending_approval';
    const msg = isPending ? `Reject registration for ${emp.name}?` : `Deactivate ${emp.name}?`;
    if (window.confirm(msg)) {
      try {
        await deleteEmployee(emp._id);
        loadEmployees();
      } catch (error) {
        alert(error.response?.data?.message || 'Error executing action');
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

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = 'Shop#';
    for (let i = 0; i < 6; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm((prev) => ({ ...prev, password: pass }));
  };

  const roleColors = {
    super_admin: 'bg-slate-900 text-white border-slate-950 font-black',
    hr_manager: 'bg-slate-800 text-white border-slate-900 font-black',
    employee: 'bg-slate-100 text-slate-800 border-slate-300 font-extrabold',
  };

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black',
    pending_approval: 'bg-amber-100 text-amber-950 border-amber-400 font-black animate-pulse',
    on_leave: 'bg-blue-100 text-blue-900 border-blue-300 font-black',
    terminated: 'bg-rose-100 text-rose-950 border-rose-300 font-black',
  };

  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.status === 'active').length;
  const pendingCount = employees.filter((e) => e.status === 'pending_approval').length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Executive Header Box (Sidebar slate-900) */}
      <div className="bg-slate-900 text-white rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight uppercase flex items-center gap-2">
            <span>👥 Staff Directory & Manual Salary Hub</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Onboard personnel, configure role permissions, allocate annual leave quotas, and manually assign monthly packages (no stepper arrows).
          </p>
        </div>
        <button
          onClick={() => { setEditingEmployee(null); resetForm(); setShowModal(true); }}
          className="px-4 py-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-black uppercase transition-all shadow shrink-0 active:scale-95 cursor-pointer"
        >
          ＋ Onboard Staff
        </button>
      </div>

      {/* 3 Small Metric Boxes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-500 uppercase">Total Workforce</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalCount}</p>
          </div>
          <span className="text-lg bg-slate-100 text-slate-900 w-8 h-8 rounded-lg flex items-center justify-center font-black">👥</span>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-500 uppercase">Active Accounts</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{activeCount}</p>
          </div>
          <span className="text-lg bg-emerald-50 text-emerald-800 w-8 h-8 rounded-lg flex items-center justify-center font-black">✓</span>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-500 uppercase">Pending Review</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{pendingCount}</p>
          </div>
          <span className="text-lg bg-amber-50 text-amber-900 w-8 h-8 rounded-lg flex items-center justify-center font-black">⏳</span>
        </div>
      </div>

      {/* Structured Controls Row */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="employee">Employee</option>
            <option value="hr_manager">HR Manager</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending_approval">Pending</option>
            <option value="on_leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Structured Responsive Table in White/Slate Theme */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-black uppercase tracking-wider border-b border-slate-800">
                  <th className="text-left py-3 px-4">Staff Member</th>
                  <th className="text-left py-3 px-4">Department & Leave Quota</th>
                  <th className="text-left py-3 px-4">Role & Status</th>
                  <th className="text-right py-3 px-4">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0 shadow">
                          {emp.name?.charAt(0) || 'E'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 truncate">{emp.name}</p>
                          <p className="text-xs text-slate-500 font-mono truncate">{emp.email} · ID: {emp.employeeId || 'NEW'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-extrabold text-slate-900">{emp.department || 'General'} ({emp.designation || 'Staff'})</p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-black">
                        🏖️ Quota: {emp.leaveBalances?.pto || 20} PTO / {emp.leaveBalances?.sick || 10} Sick
                      </span>
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border ${roleColors[emp.role] || 'bg-slate-100 text-slate-700'}`}>
                        {emp.role?.replace('_', ' ')}
                      </span>
                      <span className={`block w-max px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border ${statusColors[emp.status] || 'bg-slate-100 text-slate-700'}`}>
                        {emp.status === 'pending_approval' ? '⏳ PENDING' : emp.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {user?.role === 'hr_manager' && ['hr_manager', 'super_admin'].includes(emp.role) ? (
                        <span className="text-[11px] font-extrabold text-slate-400 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                          🔒 Admin Protected
                        </span>
                      ) : (
                        <>
                          {emp.status === 'pending_approval' && (
                            <button
                              onClick={() => handleApprove(emp)}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase transition-all shadow-xs cursor-pointer"
                            >
                              ✓ Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(emp)}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-black text-[11px] uppercase transition-all shadow-xs cursor-pointer"
                          >
                            ✎ Edit / Salary
                          </button>
                          <button
                            onClick={() => handleDelete(emp)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-black text-[11px] uppercase transition-all cursor-pointer"
                          >
                            {emp.status === 'pending_approval' ? 'Reject' : 'Deactivate'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {employees.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-extrabold text-xs">
              No staff members found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* Modal - Zero-Arrow Salary Typing in Slate/White Theme */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl border border-slate-300 flex flex-col">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-slate-800">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <span>✎ {editingEmployee ? `Edit Staff: ${editingEmployee.name}` : 'Onboard New Staff Member'}</span>
              </h2>
              <button onClick={() => { setShowModal(false); setEditingEmployee(null); }} className="text-slate-400 hover:text-white font-black text-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-6 overflow-y-auto grow text-xs font-bold">
              {/* Core Profile */}
              <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-200">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-3">1. Core Profile & Security</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-700">Full Name *</label>
                    <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white" />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-700">Email Address *</label>
                    <input type="email" required disabled={!!editingEmployee} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700">{editingEmployee ? 'Reset Password' : 'Password *'}</label>
                      <button type="button" onClick={generatePassword} className="text-[10px] text-slate-900 bg-slate-200 px-2 py-0.5 rounded uppercase">🎲 Gen</button>
                    </div>
                    <input type="text" required={!editingEmployee} placeholder={editingEmployee ? "(Unchanged)" : ""} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono" />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-700">Phone</label>
                    <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white" />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-700">Department</label>
                    <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Sales" className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white" />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-700">Designation</label>
                    <input type="text" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Manager" className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white" />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-700">Role Permission</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                      <option value="employee">Employee</option>
                      <option value="hr_manager">HR Manager</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-700">Account Status</label>
                    <select value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                      <option value="active">Active</option>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="on_leave">On Leave</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Zero-Arrow Manual Salary Package */}
              <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">2. Monthly Salary Structure (₹ Manual Typing - No Steppers)</h3>
                  <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-black">PURE TEXT NUMBERS</span>
                </div>
                <p className="text-[11px] text-slate-600 mb-2 uppercase font-extrabold">Monthly Earnings (₹)</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                  {['basic', 'hra', 'transport', 'medical', 'special'].map((key) => (
                    <div key={key}>
                      <label className="block mb-1 text-slate-700 uppercase text-[10px] font-black">{key}</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={form.salary[key] ?? ''}
                          onChange={(e) => setForm({ ...form, salary: { ...form.salary, [key]: e.target.value.replace(/[^0-9]/g, '') } })}
                          placeholder="0"
                          className="w-full pl-6 pr-2.5 py-2 rounded-lg border border-slate-300 bg-white font-black"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-rose-700 mb-2 uppercase font-extrabold border-t border-slate-200 pt-2">Standard Deductions (₹)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['tax', 'insurance', 'providentFund'].map((key) => (
                    <div key={key}>
                      <label className="block mb-1 text-rose-900 uppercase text-[10px] font-black">{key.replace('providentFund', 'PF')}</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rose-400 text-xs">₹</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={form.salary.deductions?.[key] ?? ''}
                          onChange={(e) => setForm({ ...form, salary: { ...form.salary, deductions: { ...form.salary.deductions, [key]: e.target.value.replace(/[^0-9]/g, '') } } })}
                          placeholder="0"
                          className="w-full pl-6 pr-2.5 py-2 rounded-lg border border-rose-300 bg-white font-black text-rose-950"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave Quotas */}
              <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-200">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-3">3. Annual Leave Quota Allocation (Days)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-700">PTO / Paid Leave</label>
                    <input type="text" inputMode="numeric" value={form.leaveBalances?.pto ?? '20'} onChange={(e) => setForm({ ...form, leaveBalances: { ...form.leaveBalances, pto: e.target.value.replace(/[^0-9]/g, '') } })} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-black" />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-700">Sick Leaves</label>
                    <input type="text" inputMode="numeric" value={form.leaveBalances?.sick ?? '10'} onChange={(e) => setForm({ ...form, leaveBalances: { ...form.leaveBalances, sick: e.target.value.replace(/[^0-9]/g, '') } })} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-black text-rose-700" />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-700">Casual Leaves</label>
                    <input type="text" inputMode="numeric" value={form.leaveBalances?.casual ?? '7'} onChange={(e) => setForm({ ...form, leaveBalances: { ...form.leaveBalances, casual: e.target.value.replace(/[^0-9]/g, '') } })} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-black text-emerald-800" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => { setShowModal(false); setEditingEmployee(null); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-black uppercase">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black uppercase shadow cursor-pointer">{editingEmployee ? 'Save Profile & Salary' : 'Onboard Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
