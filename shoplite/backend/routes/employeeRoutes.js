const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorise } = require('../middleware/adminMiddleware');
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
} = require('../controllers/employeeController');

// Allow strictly Super Admin and HR Manager to fully manage and approve employees
const managementOnly = authorise('super_admin', 'hr_manager');

// @route   GET /api/employees/stats
router.get('/stats', protect, managementOnly, getEmployeeStats);

// @route   GET /api/employees
router.get('/', protect, getEmployees);

// @route   GET /api/employees/:id
router.get('/:id', protect, getEmployeeById);

// @route   POST /api/employees
router.post('/', protect, managementOnly, createEmployee);

// @route   PUT /api/employees/:id
router.put('/:id', protect, managementOnly, updateEmployee);

// @route   DELETE /api/employees/:id
router.delete('/:id', protect, managementOnly, deleteEmployee);

module.exports = router;
