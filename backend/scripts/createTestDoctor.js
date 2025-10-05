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

const createTestDoctor = async () => {
  try {
    // Check if test doctor already exists
    const existingDoctor = await User.findOne({ email: 'doctor@test.com' });
    if (existingDoctor) {
      console.log('❌ Test doctor already exists:', existingDoctor.email);
      return;
    }

    // Create pending doctor for admin approval testing
    const pendingDoctorData = {
      username: 'Dr. John Pending',
      email: 'doctor.pending@test.com',
      password: 'doctor123',
      role: 'doctor',
      specialization: 'Pediatrics',
      hospitalAffiliation: 'Test General Hospital',
      medicalLicense: 'DOC123456',
      yearsOfExperience: 5,
      isApproved: false, // Pending approval
      isActive: true
    };

    const pendingDoctor = new User(pendingDoctorData);
    await pendingDoctor.save();

    console.log('✅ Pending doctor user created successfully!');
    console.log('📧 Email:', pendingDoctorData.email);
    console.log('🔑 Password:', 'doctor123');
    console.log('👤 Role:', pendingDoctorData.role);
    console.log('⏳ Status: Pending approval');

    // Create approved doctor for testing
    const approvedDoctorData = {
      username: 'Dr. Jane Approved',
      email: 'doctor@test.com',
      password: 'doctor123',
      role: 'doctor',
      specialization: 'General Practice',
      hospitalAffiliation: 'Test Medical Center',
      medicalLicense: 'DOC789012',
      yearsOfExperience: 8,
      isApproved: true, // Already approved
      isActive: true,
      approvedAt: new Date()
    };

    const approvedDoctor = new User(approvedDoctorData);
    await approvedDoctor.save();

    console.log('✅ Approved doctor user created successfully!');
    console.log('📧 Email:', approvedDoctorData.email);
    console.log('🔑 Password:', 'doctor123');
    console.log('👤 Role:', approvedDoctorData.role);
    console.log('✅ Status: Approved');
    
  } catch (error) {
    console.error('❌ Error creating test doctor users:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

const run = async () => {
  await connectDB();
  await createTestDoctor();
};

// Check if this script is being run directly
if (require.main === module) {
  run().catch(error => {
    console.error('❌ Script error:', error);
    process.exit(1);
  });
}

module.exports = { createTestDoctor };