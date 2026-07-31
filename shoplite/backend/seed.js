const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

dotenv.config();

const User = require('./models/User');
const Announcement = require('./models/Announcement');

/**
 * Seed Script — Enterprise HRIS Demo Data
 * Creates sample users with different RBAC roles,
 * salary structures, and an initial company announcement.
 */
const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Announcement.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Hash password for all demo users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('Admin@123', salt),
        phone: '+91 98765 43200',
        role: 'super_admin',
        department: 'Executive',
        designation: 'System Administrator',
        employeeId: 'EMP0000',
        status: 'active',
        salary: { basic: 150000, hra: 45000, transport: 5000, medical: 5000, special: 20000, deductions: { tax: 30000, insurance: 5000, providentFund: 18000 } },
        leaveBalances: { pto: 25, sick: 15, casual: 10 },
      },
      {
        name: 'Aman Singh',
        email: 'admin@company.com',
        password: hashedPassword,
        phone: '+91 98765 43210',
        role: 'super_admin',
        department: 'Executive',
        designation: 'CEO & Founder',
        employeeId: 'EMP0001',
        status: 'active',
        salary: {
          basic: 150000,
          hra: 45000,
          transport: 5000,
          medical: 5000,
          special: 20000,
          deductions: { tax: 30000, insurance: 5000, providentFund: 18000 },
        },
        leaveBalances: { pto: 25, sick: 15, casual: 10 },
      },
      {
        name: 'Priya Sharma',
        email: 'hr@company.com',
        password: hashedPassword,
        phone: '+91 98765 43211',
        role: 'hr_manager',
        department: 'Human Resources',
        designation: 'HR Manager',
        employeeId: 'EMP0002',
        status: 'active',
        salary: {
          basic: 80000,
          hra: 24000,
          transport: 3000,
          medical: 3000,
          special: 10000,
          deductions: { tax: 15000, insurance: 3000, providentFund: 9600 },
        },
        leaveBalances: { pto: 20, sick: 10, casual: 7 },
      },
      {
        name: 'Rahul Verma',
        email: 'finance@company.com',
        password: hashedPassword,
        phone: '+91 98765 43212',
        role: 'finance_officer',
        department: 'Finance',
        designation: 'Finance Lead',
        employeeId: 'EMP0003',
        status: 'active',
        salary: {
          basic: 75000,
          hra: 22500,
          transport: 3000,
          medical: 3000,
          special: 8000,
          deductions: { tax: 14000, insurance: 3000, providentFund: 9000 },
        },
        leaveBalances: { pto: 20, sick: 10, casual: 7 },
      },
      {
        name: 'Anita Desai',
        email: 'manager@company.com',
        password: hashedPassword,
        phone: '+91 98765 43213',
        role: 'department_manager',
        department: 'Engineering',
        designation: 'Engineering Manager',
        employeeId: 'EMP0004',
        status: 'active',
        salary: {
          basic: 90000,
          hra: 27000,
          transport: 4000,
          medical: 3500,
          special: 12000,
          deductions: { tax: 18000, insurance: 4000, providentFund: 10800 },
        },
        leaveBalances: { pto: 20, sick: 10, casual: 7 },
      },
      {
        name: 'Vikram Patel',
        email: 'vikram@company.com',
        password: hashedPassword,
        phone: '+91 98765 43214',
        role: 'employee',
        department: 'Engineering',
        designation: 'Senior Software Engineer',
        employeeId: 'EMP0005',
        status: 'active',
        salary: {
          basic: 60000,
          hra: 18000,
          transport: 2500,
          medical: 2500,
          special: 7000,
          deductions: { tax: 10000, insurance: 2500, providentFund: 7200 },
        },
        leaveBalances: { pto: 18, sick: 10, casual: 7 },
      },
      {
        name: 'Sneha Gupta',
        email: 'sneha@company.com',
        password: hashedPassword,
        phone: '+91 98765 43215',
        role: 'employee',
        department: 'Design',
        designation: 'UI/UX Designer',
        employeeId: 'EMP0006',
        status: 'active',
        salary: {
          basic: 55000,
          hra: 16500,
          transport: 2500,
          medical: 2500,
          special: 6000,
          deductions: { tax: 9000, insurance: 2500, providentFund: 6600 },
        },
        leaveBalances: { pto: 20, sick: 10, casual: 7 },
      },
      {
        name: 'Arjun Kumar',
        email: 'arjun@company.com',
        password: hashedPassword,
        phone: '+91 98765 43216',
        role: 'employee',
        department: 'Marketing',
        designation: 'Marketing Associate',
        employeeId: 'EMP0007',
        status: 'active',
        salary: {
          basic: 45000,
          hra: 13500,
          transport: 2000,
          medical: 2000,
          special: 5000,
          deductions: { tax: 7000, insurance: 2000, providentFund: 5400 },
        },
        leaveBalances: { pto: 20, sick: 10, casual: 7 },
      },
      {
        name: 'Neha Joshi',
        email: 'neha@company.com',
        password: hashedPassword,
        phone: '+91 98765 43217',
        role: 'employee',
        department: 'Engineering',
        designation: 'Junior Developer',
        employeeId: 'EMP0008',
        status: 'active',
        salary: {
          basic: 35000,
          hra: 10500,
          transport: 2000,
          medical: 1500,
          special: 4000,
          deductions: { tax: 5000, insurance: 1500, providentFund: 4200 },
        },
        leaveBalances: { pto: 20, sick: 10, casual: 7 },
      },
    ]);

    console.log(`✅ Created ${users.length} demo employees`);

    // Set reporting managers (after users are created)
    const admin = users[0];
    const hrManager = users[1];
    const engManager = users[3];

    // HR, Finance, Eng Manager report to CEO
    await User.updateMany(
      { _id: { $in: [hrManager._id, users[2]._id, engManager._id] } },
      { reportingManager: admin._id }
    );

    // Engineers report to Eng Manager
    await User.updateMany(
      { _id: { $in: [users[4]._id, users[7]._id] } },
      { reportingManager: engManager._id }
    );

    // Designer & Marketing report to HR
    await User.updateMany(
      { _id: { $in: [users[5]._id, users[6]._id] } },
      { reportingManager: hrManager._id }
    );

    console.log('✅ Set reporting manager hierarchy');

    // Create a welcome announcement
    await Announcement.create({
      title: '🎉 Welcome to the New Enterprise HRIS!',
      content: 'We are excited to launch our new Company Management System! You can now check your attendance, apply for leaves, view salary slips, schedule meetings, and submit expense claims — all from your mobile app. HR and Finance teams can manage everything from the admin dashboard. Welcome aboard!',
      author: admin._id,
      category: 'general',
      priority: 'high',
    });

    await Announcement.create({
      title: '📋 Attendance Policy Reminder',
      content: 'Please remember to check in every morning before 9:30 AM using the mobile app. Late check-ins will be marked accordingly. If you are working remotely, ensure your GPS is enabled for location verification. Contact HR for any issues.',
      author: hrManager._id,
      category: 'policy',
      priority: 'normal',
    });

    console.log('✅ Created sample announcements');

    console.log('\n================================================');
    console.log('  🎯 DEMO CREDENTIALS (Password: password123)');
    console.log('================================================');
    console.log('  Super Admin:  admin@company.com');
    console.log('  HR Manager:   hr@company.com');
    console.log('  Finance:      finance@company.com');
    console.log('  Dept Manager: manager@company.com');
    console.log('  Employee:     vikram@company.com');
    console.log('  Employee:     sneha@company.com');
    console.log('  Employee:     arjun@company.com');
    console.log('  Employee:     neha@company.com');
    console.log('================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
