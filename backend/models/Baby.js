const mongoose = require('mongoose');

const vaccineScheduleItemSchema = new mongoose.Schema({
  vaccineName: { type: String, required: true },
  doseNumber: { type: Number, default: 1 },
  dueDate: { type: Date, required: true },
  ageInWeeks: { type: Number, required: true },
  status: {
    type: String,
    enum: ['upcoming', 'overdue', 'completed', 'pending_approval'],
    default: 'upcoming'
  },
  completedDate: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  parentNotes: { type: String },
  doctorNotes: { type: String },
  requestedAt: { type: Date },
  approvedAt: { type: Date }
});

const babySchema = new mongoose.Schema({
  name: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'], 
    required: true 
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  parentEmail: { type: String, required: true },
  
  // Baby details
  birthWeight: { type: Number }, // in kg
  birthHeight: { type: Number }, // in cm
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  
  // Medical information
  allergies: [String],
  medicalConditions: [String],
  specialNotes: { type: String },
  
  // Vaccination schedule
  vaccinationSchedule: [vaccineScheduleItemSchema],
  
  // Tracking
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to update timestamp
babySchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Method to generate vaccination schedule based on date of birth
babySchema.methods.generateVaccinationSchedule = function() {
  const birthDate = new Date(this.dateOfBirth);
  const schedule = [];
  
  // Standard vaccination schedule (Indian schedule)
  const vaccineTemplates = [
    { name: 'BCG', ageInWeeks: 0, description: 'Bacillus Calmette-Guérin vaccine' },
    { name: 'Hepatitis B (Birth Dose)', ageInWeeks: 0, description: 'First dose of Hepatitis B' },
    { name: 'OPV-0', ageInWeeks: 0, description: 'Oral Polio Vaccine - Birth dose' },
    
    { name: 'DTP-1', ageInWeeks: 6, description: 'Diphtheria, Tetanus, Pertussis - First dose' },
    { name: 'Hepatitis B-1', ageInWeeks: 6, description: 'Hepatitis B - First dose' },
    { name: 'Hib-1', ageInWeeks: 6, description: 'Haemophilus influenzae type b - First dose' },
    { name: 'Rotavirus-1', ageInWeeks: 6, description: 'Rotavirus vaccine - First dose' },
    { name: 'PCV-1', ageInWeeks: 6, description: 'Pneumococcal Conjugate Vaccine - First dose' },
    { name: 'OPV-1', ageInWeeks: 6, description: 'Oral Polio Vaccine - First dose' },
    
    { name: 'DTP-2', ageInWeeks: 10, description: 'Diphtheria, Tetanus, Pertussis - Second dose' },
    { name: 'Hepatitis B-2', ageInWeeks: 10, description: 'Hepatitis B - Second dose' },
    { name: 'Hib-2', ageInWeeks: 10, description: 'Haemophilus influenzae type b - Second dose' },
    { name: 'Rotavirus-2', ageInWeeks: 10, description: 'Rotavirus vaccine - Second dose' },
    { name: 'PCV-2', ageInWeeks: 10, description: 'Pneumococcal Conjugate Vaccine - Second dose' },
    { name: 'OPV-2', ageInWeeks: 10, description: 'Oral Polio Vaccine - Second dose' },
    
    { name: 'DTP-3', ageInWeeks: 14, description: 'Diphtheria, Tetanus, Pertussis - Third dose' },
    { name: 'Hepatitis B-3', ageInWeeks: 14, description: 'Hepatitis B - Third dose' },
    { name: 'Hib-3', ageInWeeks: 14, description: 'Haemophilus influenzae type b - Third dose' },
    { name: 'Rotavirus-3', ageInWeeks: 14, description: 'Rotavirus vaccine - Third dose' },
    { name: 'PCV-3', ageInWeeks: 14, description: 'Pneumococcal Conjugate Vaccine - Third dose' },
    { name: 'OPV-3', ageInWeeks: 14, description: 'Oral Polio Vaccine - Third dose' },
    { name: 'IPV-1', ageInWeeks: 14, description: 'Inactivated Polio Vaccine' },
    
    { name: 'Measles-1', ageInWeeks: 36, description: 'Measles vaccine - First dose (9 months)' },
    { name: 'JE-1', ageInWeeks: 36, description: 'Japanese Encephalitis - First dose' },
    { name: 'Vitamin A-1', ageInWeeks: 36, description: 'Vitamin A supplement' },
    
    { name: 'DTP Booster-1', ageInWeeks: 68, description: 'DTP Booster (16-24 months)' },
    { name: 'OPV Booster', ageInWeeks: 68, description: 'OPV Booster (16-24 months)' },
    { name: 'Measles-2', ageInWeeks: 68, description: 'Measles vaccine - Second dose' },
    { name: 'JE-2', ageInWeeks: 68, description: 'Japanese Encephalitis - Second dose' },
    
    { name: 'DTP Booster-2', ageInWeeks: 260, description: 'DTP Booster (5-6 years)' },
    { name: 'Typhoid', ageInWeeks: 260, description: 'Typhoid vaccine' },
  ];
  
  vaccineTemplates.forEach(template => {
    const dueDate = new Date(birthDate);
    dueDate.setDate(dueDate.getDate() + (template.ageInWeeks * 7));
    
    const today = new Date();
    let status = 'upcoming';
    
    if (dueDate < today) {
      // Check if it's more than 2 weeks overdue
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(today.getDate() - 14);
      status = dueDate < twoWeeksAgo ? 'overdue' : 'upcoming';
    }
    
    schedule.push({
      vaccineName: template.name,
      doseNumber: 1,
      dueDate: dueDate,
      ageInWeeks: template.ageInWeeks,
      status: status,
      description: template.description
    });
  });
  
  return schedule;
};

// Method to update vaccination status based on due dates
babySchema.methods.updateVaccinationStatus = function() {
  const today = new Date();
  const twoWeeksOverdue = new Date();
  twoWeeksOverdue.setDate(today.getDate() - 14);
  
  this.vaccinationSchedule.forEach(vaccine => {
    if (vaccine.status === 'upcoming' && vaccine.dueDate < twoWeeksOverdue) {
      vaccine.status = 'overdue';
    }
  });
  
  return this.save();
};

// Static method to get vaccination statistics
babySchema.statics.getVaccinationStats = function(parentId) {
  return this.aggregate([
    { $match: { parentId: mongoose.Types.ObjectId(parentId) } },
    { $unwind: '$vaccinationSchedule' },
    {
      $group: {
        _id: '$vaccinationSchedule.status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Index for better query performance
babySchema.index({ parentId: 1 });
babySchema.index({ parentEmail: 1 });
babySchema.index({ 'vaccinationSchedule.status': 1 });
babySchema.index({ 'vaccinationSchedule.dueDate': 1 });

module.exports = mongoose.model('Baby', babySchema);