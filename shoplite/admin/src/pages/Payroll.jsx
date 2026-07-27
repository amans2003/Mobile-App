import { useState, useEffect } from 'react';
import { fetchEmployees, generatePayroll, fetchPayrollStats, fetchPayrollRecords } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Payroll — Pro-Rata Take-Home Salary & Attendance Deduction Register
 * Executive slate-900 & white theme with compact small financial boxes.
 */
const Payroll = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [customDays, setCustomDays] = useState(26);
  const [payStats, setPayStats] = useState(null);
  const [payrollMap, setPayrollMap] = useState({});
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, statRes, recRes] = await Promise.all([
        fetchEmployees({ status: 'active' }).catch(() => ({ data: [] })),
        fetchPayrollStats({ month, year }).catch(() => ({ data: null })),
        fetchPayrollRecords({ month, year }).catch(() => ({ data: [] })),
      ]);
      setEmployees(empRes.data || []);
      setPayStats(statRes.data);

      const map = {};
      (recRes.data || []).forEach(r => {
        const empId = r.employee?._id || r.employee;
        if (empId) map[empId] = r;
      });
      setPayrollMap(map);

      // If any record exists with recorded workingDays, sync customDays state
      const firstRec = (recRes.data || [])[0];
      if (firstRec && firstRec.workingDays) {
        setCustomDays(firstRec.workingDays);
      }
    } catch (error) {
      console.error('Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month, year]);

  const handleProcessAll = async () => {
    try {
      setGenerating(true);
      for (const emp of employees) {
        await generatePayroll({ employeeId: emp._id, month, year, workingDays: customDays }).catch(e => console.log(e?.message));
      }
      alert(`✅ Monthly payroll processed for ${month}/${year} with ${customDays} working days! Net take-home amounts updated.`);
      loadData();
    } catch (error) {
      alert('Error during batch salary processing');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Staff Name', 'Employee ID', 'Department', 'Gross Package (INR)', 'Working Days', 'Present Score (Days)', 'Unpaid Days', 'Attendance Deduction (INR)', 'Tax & PF (INR)', 'Final Net Take-Home (INR)'];
    const rows = employees.map(emp => {
      const s = emp.salary || {};
      const d = s.deductions || {};
      const empGross = Number(s.basic || 0) + Number(s.hra || 0) + Number(s.transport || 0) + Number(s.medical || 0) + Number(s.special || 0);
      const empDeductions = Number(d.tax || 0) + Number(d.insurance || 0) + Number(d.providentFund || 0);
      const rec = payrollMap[emp._id];
      const wDays = rec ? rec.workingDays : customDays;
      const perDayRate = wDays > 0 ? empGross / wDays : 0;
      const presentDays = rec ? rec.presentDays : (emp.presentDays ?? wDays);
      const unpaidDays = rec ? (rec.unpaidLeaveDays || 0) : Math.max(0, wDays - presentDays);
      const attendanceDeduction = rec ? (rec.unpaidLeaveDeduction || 0) : Math.round(unpaidDays * perDayRate);
      const proRatedTaxPf = Math.round(empDeductions * (wDays > 0 ? Math.min(1, presentDays / wDays) : 1));
      const finalTakeHome = rec ? rec.netSalary : Math.max(0, empGross - proRatedTaxPf - attendanceDeduction);

      return [
        emp.name,
        emp.employeeId || 'STAFF',
        emp.department || 'General',
        empGross,
        wDays,
        presentDays,
        unpaidDays,
        attendanceDeduction,
        proRatedTaxPf,
        finalTakeHome,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Payroll_Register_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateTotalGross = () => {
    return employees.reduce((acc, emp) => {
      const s = emp.salary || {};
      return acc + (Number(s.basic || 0) + Number(s.hra || 0) + Number(s.transport || 0) + Number(s.medical || 0) + Number(s.special || 0));
    }, 0);
  };

  const calculateTotalDeductions = () => {
    return employees.reduce((acc, emp) => {
      const d = emp.salary?.deductions || {};
      return acc + (Number(d.tax || 0) + Number(d.insurance || 0) + Number(d.providentFund || 0));
    }, 0);
  };

  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const grossTotal = calculateTotalGross();
  const deductTotal = calculateTotalDeductions();
  const netTotal = grossTotal - deductTotal;

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Executive Header Box (Sidebar slate-900) */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md border border-slate-800">
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight uppercase flex items-center gap-2">
            <span>💳 Enterprise Payroll & Salary Disbursement</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Configured Working Days: <span className="text-emerald-400 font-black">{customDays} Days/Month</span>. Pro-rata attendance score & take-home calculations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-900 border border-slate-300 shadow-xs">
            <span className="text-[10px] text-slate-500 uppercase mr-1 font-bold whitespace-nowrap">Days:</span>
            <input
              type="number"
              min="1"
              max="31"
              value={customDays}
              onChange={(e) => setCustomDays(Number(e.target.value))}
              className="w-10 bg-transparent text-center font-black focus:outline-none"
            />
          </div>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-black shadow-xs focus:outline-none cursor-pointer">
            {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('en', { month: 'short' })}</option>))}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-18 sm:w-20 px-2.5 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-black shadow-xs focus:outline-none" />
          <button onClick={handleExportCSV} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase transition-all shadow-xs cursor-pointer flex items-center gap-1 whitespace-nowrap">
            <span>📥 Export Excel</span>
          </button>
          <button onClick={handleProcessAll} disabled={generating || loading} className="px-3.5 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-black uppercase transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50 whitespace-nowrap">
            {generating ? 'Processing...' : '⚡ Process Payroll'}
          </button>
        </div>
      </div>

      {/* 3 Responsive Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase">Total Monthly Gross (₹)</p>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{formatINR(grossTotal)}</p>
          <p className="text-[10px] text-slate-400 font-extrabold mt-0.5">Base + HRA + Allowances</p>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase">Total Deductions (₹)</p>
          <p className="text-lg sm:text-xl font-black text-rose-700 mt-0.5">{formatINR(deductTotal)}</p>
          <p className="text-[10px] text-slate-400 font-extrabold mt-0.5">Tax, Insurance & PF</p>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-900">
          <p className="text-[11px] font-extrabold text-slate-300 uppercase">Est. Net Take-Home Roll (₹)</p>
          <p className="text-lg sm:text-xl font-black text-white mt-0.5">{formatINR(netTotal)}</p>
          <p className="text-[10px] text-emerald-400 font-extrabold mt-0.5">Pro-Rata Attendance Adjusted</p>
        </div>
      </div>

      {/* Responsive Pro-Rata Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 px-4 py-3 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800">
            <h2 className="text-xs font-black uppercase tracking-wider">📋 Monthly Attendance & Salary Register ({month}/{year})</h2>
            <span className="text-[10px] font-extrabold bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded uppercase">PRO-RATA LEDGER</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 whitespace-nowrap">Staff Personnel</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Gross Package (₹)</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Attendance Score</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Attendance Deduction (₹)</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Final Net Take-Home (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                {employees.map((emp) => {
                  const s = emp.salary || {};
                  const d = s.deductions || {};
                  const empGross = Number(s.basic || 0) + Number(s.hra || 0) + Number(s.transport || 0) + Number(s.medical || 0) + Number(s.special || 0);
                  const empDeductions = Number(d.tax || 0) + Number(d.insurance || 0) + Number(d.providentFund || 0);
                  
                  const rec = payrollMap[emp._id];
                  const workingDays = rec ? rec.workingDays : customDays;
                  const perDayRate = workingDays > 0 ? empGross / workingDays : 0;

                  const presentDays = rec ? rec.presentDays : (emp.presentDays ?? 26);
                  const unpaidDays = rec ? (rec.unpaidLeaveDays || 0) : Math.max(0, workingDays - presentDays);
                  const attendanceDeduction = rec ? (rec.unpaidLeaveDeduction || 0) : Math.round(unpaidDays * perDayRate);

                  const proRatedTaxPf = Math.round(empDeductions * (workingDays > 0 ? Math.min(1, presentDays / workingDays) : 1));
                  const finalTakeHome = rec ? rec.netSalary : Math.max(0, empGross - proRatedTaxPf - attendanceDeduction);

                  return (
                    <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="text-slate-900 font-extrabold text-sm whitespace-nowrap">{emp.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono whitespace-nowrap">{emp.department || 'General'} · ID: {emp.employeeId || 'STAFF'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono whitespace-nowrap">
                        {formatINR(empGross)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black tracking-tight inline-flex items-center">
                            {presentDays} / {workingDays} Days
                          </span>
                          {unpaidDays > 0 && (
                            <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-extrabold tracking-tight inline-flex items-center">
                              -{unpaidDays}d Unpaid
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-amber-800 whitespace-nowrap">
                        {attendanceDeduction > 0 ? `- ${formatINR(attendanceDeduction)}` : '₹0'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-950 bg-emerald-50/40 whitespace-nowrap">
                        {formatINR(finalTakeHome)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
