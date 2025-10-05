const mongoose = require('mongoose');

const vaccinationRequestSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  vaccineScheduleIndex: {
    type: Number,
    required: true // Index in the child's vaccinationSchedule array
  },
  parentEmail: {
    type: String,
    required: true
  },
  
  // Request details
  vaccineName: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  requestedCompletionDate: { type: Date, required: true },
  
  // Parent submission
  parentNotes: { type: String },
  attachments: [String], // URLs to uploaded documents/photos
  
  // Request status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  
  // Doctor response
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  doctorNotes: { type: String },
  rejectionReason: { type: String },
  
  // Additional verification details
  hospitalName: { type: String },
  administeredBy: { type: String }, // Doctor/nurse name
  batchNumber: { type: String },
  manufacturer: { type: String },
  sideEffects: [String],
  
  // Timestamps
  requestedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  completedAt: { type: Date },
  
  // Tracking
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'overdue'],
    default: 'normal'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to update timestamp
vaccinationRequestSchema.pre('save', function() {
  this.updatedAt = Date.now();
  
  // Set priority based on how overdue the vaccine is
  if (this.scheduledDate) {
    const today = new Date();
    const daysDifference = Math.floor((today - this.scheduledDate) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > 30) {
      this.priority = 'overdue';
    } else if (daysDifference > 7) {
      this.priority = 'urgent';
    }
  }
});

// Instance methods
vaccinationRequestSchema.methods.approve = function(doctorId, doctorNotes) {
  this.status = 'approved';
  this.reviewedBy = doctorId;
  this.doctorNotes = doctorNotes;
  this.reviewedAt = new Date();
  this.completedAt = new Date();
  return this.save();
};

vaccinationRequestSchema.methods.reject = function(doctorId, rejectionReason) {
  this.status = 'rejected';
  this.reviewedBy = doctorId;
  this.rejectionReason = rejectionReason;
  this.reviewedAt = new Date();
  return this.save();
};

// Static methods
vaccinationRequestSchema.statics.getPendingRequests = function(doctorId = null) {
  const query = { status: 'pending' };
  if (doctorId) {
    // If specific doctor, could add hospital-based filtering later
  }
  
  return this.find(query)
    .populate('childId', 'name dateOfBirth parentEmail gender vaccinationSchedule')
    .populate('reviewedBy', 'username email specialization')
    .sort({ priority: -1, requestedAt: 1 }); // Overdue first, then oldest first
};

vaccinationRequestSchema.statics.getRequestsByParent = function(parentEmail) {
  return this.find({ parentEmail })
    .populate('childId', 'name dateOfBirth gender')
    .populate('reviewedBy', 'username specialization hospitalAffiliation')
    .sort({ requestedAt: -1 });
};

vaccinationRequestSchema.statics.getRequestStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Indexes for better query performance
vaccinationRequestSchema.index({ status: 1, requestedAt: 1 });
vaccinationRequestSchema.index({ parentEmail: 1, requestedAt: -1 });
vaccinationRequestSchema.index({ reviewedBy: 1 });
vaccinationRequestSchema.index({ childId: 1 });
vaccinationRequestSchema.index({ priority: 1 });

module.exports = mongoose.model('VaccinationRequest', vaccinationRequestSchema);