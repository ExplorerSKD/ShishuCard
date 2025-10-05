const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Child = require('../models/Child');
const VaccinationRequest = require('../models/VaccinationRequest');
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

const createTestRequests = async () => {
  try {
    // Find a parent user
    const parent = await User.findOne({ role: 'parent' });
    if (!parent) {
      console.log('❌ No parent user found. Please register a parent first.');
      return;
    }

    console.log(`👤 Found parent: ${parent.email}`);

    // Find or create a test child
    let child = await Child.findOne({ parentEmail: parent.email });
    
    if (!child) {
      console.log('📝 Creating test child...');
      child = await Child.create({
        name: 'Test Baby',
        dateOfBirth: new Date(Date.now() - (90 * 24 * 60 * 60 * 1000)), // 90 days ago
        gender: 'male',
        parentEmail: parent.email,
        bloodGroup: 'O+'
      });
      console.log(`👶 Created test child: ${child.name}`);
    } else {
      console.log(`👶 Using existing child: ${child.name}`);
    }

    // Create vaccination requests for overdue vaccines
    const overdueVaccines = child.vaccinationSchedule.filter(v => 
      v.status === 'overdue' || v.status === 'upcoming'
    ).slice(0, 3); // Take first 3 for testing

    for (const vaccine of overdueVaccines) {
      const existingRequest = await VaccinationRequest.findOne({
        childId: child._id,
        vaccineName: vaccine.vaccineName,
        status: 'pending'
      });

      if (!existingRequest) {
        const request = await VaccinationRequest.create({
          childId: child._id,
          vaccineScheduleIndex: child.vaccinationSchedule.indexOf(vaccine),
          parentEmail: parent.email,
          vaccineName: vaccine.vaccineName,
          scheduledDate: vaccine.dueDate,
          requestedCompletionDate: new Date(),
          parentNotes: `Test request for ${vaccine.vaccineName} - administered at local clinic`,
          status: 'pending'
        });

        console.log(`✅ Created vaccination request for: ${vaccine.vaccineName}`);
      } else {
        console.log(`ℹ️  Request already exists for: ${vaccine.vaccineName}`);
      }
    }

    console.log('\n🎉 Test vaccination requests created successfully!');
    console.log('\nYou can now:');
    console.log('1. Login as doctor: doctor@test.com / doctor123');
    console.log('2. See pending requests on the doctor dashboard');
    console.log('3. Test approve/reject functionality');
    
  } catch (error) {
    console.error('❌ Error creating test requests:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

const run = async () => {
  await connectDB();
  await createTestRequests();
};

// Check if this script is being run directly
if (require.main === module) {
  run().catch(error => {
    console.error('❌ Script error:', error);
    process.exit(1);
  });
}

module.exports = { createTestRequests };