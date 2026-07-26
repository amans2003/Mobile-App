const User = require('../models/User');

/**
 * @desc    Get all employees (directory & admin management)
 * @route   GET /api/employees
 * @access  Private
 */
const getEmployees = async (req, res) => {
  try {
    const { department, role, status, search } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (role) filter.role = role;
    
    // Allow filtering by exact status, otherwise show all employees so Admin/HR/Finance see pending signups too!
    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await User.find(filter)
      .select('-password')
      .populate('reportingManager', 'name email designation')
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error.message);
    res.status(500).json({ message: 'Server error fetching employees' });
  }
};

/**
 * @desc    Get a single employee by ID
 * @route   GET /api/employees/:id
 * @access  Private
 */
const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select('-password')
      .populate('reportingManager', 'name email designation');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error.message);
    res.status(500).json({ message: 'Server error fetching employee' });
  }
};

/**
 * @desc    Create a new employee (HR onboarding directly as active)
 * @route   POST /api/employees
 * @access  HR / Admin / Finance
 */
const createEmployee = async (req, res) => {
  try {
    const { name, email, password, phone, role, department, designation, reportingManager, salary, address, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Enforce governance: HR Managers cannot create or appoint accounts with hr_manager or super_admin roles
    if (req.user && req.user.role === 'hr_manager' && ['hr_manager', 'super_admin'].includes(role)) {
      return res.status(403).json({ message: 'Access Denied: Only a Super Admin can appoint HR Manager or Admin roles.' });
    }

    // Auto-generate employee ID
    const count = await User.countDocuments();
    const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;

    const employee = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: role || 'employee',
      department: department || '',
      designation: designation || '',
      reportingManager: reportingManager || null,
      salary: salary || {},
      address: address || '',
      status: status || 'active', // Direct admin creations default to active
      employeeId,
    });

    const created = await User.findById(employee._id)
      .select('-password')
      .populate('reportingManager', 'name email designation');

    res.status(201).json(created);
  } catch (error) {
    console.error('Create employee error:', error.message);
    res.status(500).json({ message: 'Server error creating employee' });
  }
};

/**
 * @desc    Update an employee (approve signup, change salary/role, etc.)
 * @route   PUT /api/employees/:id
 * @access  HR / Admin / Finance
 */
const updateEmployee = async (req, res) => {
  try {
    const { name, phone, role, department, designation, reportingManager, salary, status, address, leaveBalances, password } = req.body;

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Enforce governance: HR Managers cannot edit HR or Super Admin profiles, nor can they promote staff to HR/Admin
    if (req.user && req.user.role === 'hr_manager') {
      if (['hr_manager', 'super_admin'].includes(employee.role)) {
        return res.status(403).json({ message: 'Access Denied: HR Managers cannot edit HR Manager or Admin accounts. Contact a Super Admin.' });
      }
      if (role !== undefined && ['hr_manager', 'super_admin'].includes(role)) {
        return res.status(403).json({ message: 'Access Denied: Only a Super Admin can promote staff to HR Manager or Super Admin.' });
      }
    }

    // Update fields if provided
    if (name !== undefined) employee.name = name;
    if (phone !== undefined) employee.phone = phone;
    if (role !== undefined) employee.role = role;
    if (department !== undefined) employee.department = department;
    if (designation !== undefined) employee.designation = designation;
    if (reportingManager !== undefined) employee.reportingManager = reportingManager;
    if (salary !== undefined) employee.salary = { ...employee.salary.toObject?.() || employee.salary, ...salary };
    if (status !== undefined) employee.status = status;
    if (address !== undefined) employee.address = address;
    if (leaveBalances !== undefined) employee.leaveBalances = { ...employee.leaveBalances.toObject?.() || employee.leaveBalances, ...leaveBalances };

    // Allow HR / Admin to reset password
    if (password && password.trim() !== '') {
      employee.password = password; // Hashed automatically via userSchema.pre('save') hook
    }

    await employee.save();

    const updated = await User.findById(employee._id)
      .select('-password')
      .populate('reportingManager', 'name email designation');

    res.json(updated);
  } catch (error) {
    console.error('Update employee error:', error.message);
    res.status(500).json({ message: 'Server error updating employee' });
  }
};

/**
 * @desc    Delete / deactivate / reject an employee
 * @route   DELETE /api/employees/:id
 * @access  HR / Admin / Finance
 */
const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Enforce governance: HR Managers cannot terminate or remove HR Managers or Super Admins
    if (req.user && req.user.role === 'hr_manager' && ['hr_manager', 'super_admin'].includes(employee.role)) {
      return res.status(403).json({ message: 'Access Denied: HR Managers cannot terminate or delete HR Manager or Admin accounts.' });
    }

    // If pending_approval, completely remove or mark terminated
    if (employee.status === 'pending_approval') {
      await User.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Pending registration request rejected and deleted.' });
    }

    // Soft delete: mark as terminated for regular employees
    employee.status = 'terminated';
    await employee.save();

    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error('Delete employee error:', error.message);
    res.status(500).json({ message: 'Server error deleting employee' });
  }
};

/**
 * @desc    Get employee count and department stats
 * @route   GET /api/employees/stats
 * @access  HR / Admin / Finance
 */
const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ status: 'active' });
    const pendingCount = await User.countDocuments({ status: 'pending_approval' });
    const departmentStats = await User.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const roleStats = await User.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    res.json({ totalEmployees, pendingCount, departmentStats, roleStats });
  } catch (error) {
    console.error('Get employee stats error:', error.message);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
};
