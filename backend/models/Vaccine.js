const mongoose = require('mongoose');

const vaccineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  ageGroup: {
    type: String,
    required: true // e.g., "0-2 months", "6-14 weeks", etc.
  },
  dosage: {
    type: String,
    required: true
  },
  route: {
    type: String,
    enum: ['oral', 'intramuscular', 'subcutaneous', 'intradermal'],
    required: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  sideEffects: [String],
  contraindications: [String],
  schedule: {
    primaryDoses: {
      type: Number,
      required: true,
      default: 1
    },
    intervalBetweenDoses: {
      type: String // e.g., "4 weeks", "6 months"
    },
    boosterRequired: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Vaccine', vaccineSchema);