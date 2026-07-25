const mongoose = require('mongoose');

/**
 * Connect to MongoDB (Atlas / Local)
 * Uses MONGO_URI from environment variables with diagnostic logs
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shoplite';

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.error('-------------------------------------------------------------------------');
      console.error('🔑 AUTHENTICATION FAILED TROUBLESHOOTING GUIDE:');
      console.error('1. Check Database User vs Atlas Account: Ensure you are using a user created under "Database Access", NOT your website login email.');
      console.error('2. URL Encoding: If your database password contains special characters (@, #, $, %, etc.), replace them with alphanumeric passwords or URL encode them.');
      console.error('3. IP Whitelist: In MongoDB Atlas sidebar, go to "Network Access" -> click "Add IP Address" -> choose "Allow Access From Anywhere (0.0.0.0/0)".');
      console.error('-------------------------------------------------------------------------');
    }

    process.exit(1);
  }
};

module.exports = connectDB;
