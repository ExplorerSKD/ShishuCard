const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/vaccination_portal';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('❌ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminData = {
      username: 'admin',
      email: 'admin@vaccination-portal.com',
      password: 'admin123', // This will be hashed automatically by the User model
      role: 'admin',
      isApproved: true,
      isActive: true,
      approvedBy: null,
      approvedAt: new Date()
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', 'admin123');
    console.log('👤 Role:', adminData.role);
    console.log('');
    console.log('🚨 IMPORTANT: Change the default password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

const run = async () => {
  await connectDB();
  await createAdmin();
};

// Check if this script is being run directly
if (require.main === module) {
  run().catch(error => {
    console.error('❌ Script error:', error);
    process.exit(1);
  });
}

module.exports = { createAdmin };