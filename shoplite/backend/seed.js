const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config();

/**
 * Seed script - Creates a default admin account
 * Run with: node seed.js
 */
const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });

    if (existingAdmin) {
      console.log('Admin account already exists.');
      console.log('Email: admin@example.com');
      console.log('Password: Admin@123');
    } else {
      // Create admin user
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'Admin@123',
        role: 'admin',
      });

      console.log('Admin account created successfully!');
      console.log('Email: admin@example.com');
      console.log('Password: Admin@123');
      console.log('User ID:', admin._id);
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
