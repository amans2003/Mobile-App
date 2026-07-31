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

// Robust CORS configuration supporting production web origins (Vercel), mobile apps, and local dev
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman) or any web origin
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200 // Return 200 OK for OPTIONS preflight (prevents proxy issues with 204)
};

// Enable CORS middleware for all routes and preflight OPTIONS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Additional fallback middleware to guarantee CORS headers on all responses (including errors/404s/preflights)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// ROUTES — Enterprise HRIS API
// ============================================================

// Auth (mounted with and without /api prefix for robust compatibility)
app.use(['/api/auth', '/auth'], authRoutes);

// Employee Management & Directory
app.use(['/api/employees', '/employees'], employeeRoutes);

// Attendance — Check-In / Check-Out
app.use(['/api/attendance', '/attendance'], attendanceRoutes);

// Leave Requests
app.use(['/api/leaves', '/leaves'], leaveRoutes);

// Payroll & Salary
app.use(['/api/payroll', '/payroll'], payrollRoutes);

// Expense Claims
app.use(['/api/expenses', '/expenses'], expenseRoutes);

// Meetings
app.use(['/api/meetings', '/meetings'], meetingRoutes);

// Announcements & Company Feed
app.use(['/api/announcements', '/announcements'], announcementRoutes);

// Health check endpoint
app.get(['/', '/api'], (req, res) => {
  res.json({ message: 'Enterprise HRIS API is running', version: '2.0.0', status: 'healthy' });
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
