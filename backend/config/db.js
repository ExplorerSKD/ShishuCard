// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use local MongoDB connection with fallback to environment variable
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/vaccination_portal';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected to:', mongoURI);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
