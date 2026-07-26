const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const announcementRoutes = require('./routes/announcementRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ============================================================
// MIDDLEWARE
// ============================================================

// Enable CORS for all origins (development)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// ROUTES — Enterprise HRIS API
// ============================================================

// Auth
app.use('/api/auth', authRoutes);

// Employee Management & Directory
app.use('/api/employees', employeeRoutes);

// Attendance — Check-In / Check-Out
app.use('/api/attendance', attendanceRoutes);

// Leave Requests
app.use('/api/leaves', leaveRoutes);

// Payroll & Salary
app.use('/api/payroll', payrollRoutes);

// Expense Claims
app.use('/api/expenses', expenseRoutes);

// Meetings
app.use('/api/meetings', meetingRoutes);

// Announcements & Company Feed
app.use('/api/announcements', announcementRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Enterprise HRIS API is running', version: '2.0.0' });
});

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Enterprise HRIS Server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
});
