const mongoose = require('mongoose');

const vaccinationRecordSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  vaccineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vaccine',
    required: true
  },
  vaccineName: {
    type: String,
    required: true
  },
  dateAdministered: {
    type: Date,
    required: true
  },
  doseNumber: {
    type: Number,
    required: true,
    default: 1
  },
  nextDueDate: {
    type: Date // For next dose if applicable
  },
  administeredBy: {
    doctorName: {
      type: String,
      required: true
    },
    hospitalName: {
      type: String,
      required: true
    },
    registrationNumber: String
  },
  batchNumber: {
    type: String,
    required: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  siteOfAdministration: {
    type: String,
    enum: ['left arm', 'right arm', 'left thigh', 'right thigh', 'oral'],
    required: true
  },
  reactions: [{
    type: String,
    description: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    }
  }],
  notes: String,
  isCompleted: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

vaccinationRecordSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Index for faster queries
vaccinationRecordSchema.index({ childId: 1, dateAdministered: -1 });
vaccinationRecordSchema.index({ childId: 1, vaccineId: 1 });

module.exports = mongoose.model('VaccinationRecord', vaccinationRecordSchema);