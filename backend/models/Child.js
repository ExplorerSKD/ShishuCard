const mongoose = require('mongoose');

const vaccinationScheduleSchema = new mongoose.Schema({
  vaccineName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  ageInDays: {
    type: Number,
    required: true // Age when vaccine should be given (in days from birth)
  },
  dueDate: {
    type: Date,
    required: true // Calculated due date for this child
  },
  status: {
    type: String,
    enum: ['upcoming', 'overdue', 'completed', 'pending_approval'],
    default: 'upcoming'
  },
  administerDate: {
    type: Date,
    default: null // When the vaccine was actually given
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Doctor who approved
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  parentNotes: {
    type: String,
    default: '' // Notes from parent when requesting completion
  },
  doctorNotes: {
    type: String,
    default: '' // Notes from doctor during approval/rejection
  },
  cost: {
    type: String,
    default: 'Free'
  }
});

const childSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  parentEmail: {
    type: String,
    required: true,
    ref: 'User'
  },
  aadharNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  // Enhanced vaccination schedule
  vaccinationSchedule: [vaccinationScheduleSchema],
  
  // Parent information
  parentInfo: {
    motherName: String,
    motherPhone: String,
    fatherName: String,
    fatherPhone: String,
    email: String
  },
  
  // Birth information
  birthInfo: {
    place: String,
    hospital: String,
    attendingDoctor: String
  },
  
  medicalHistory: [{
    condition: String,
    diagnosis: Date,
    notes: String
  }],
  
  isActive: {
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

// Default vaccination schedule template
const DEFAULT_VACCINATION_SCHEDULE = [
  { vaccineName: 'BCG', description: 'Bacillus Calmette–Guérin vaccine against tuberculosis', ageInDays: 0, cost: 'Free' },
  { vaccineName: 'Hepatitis B (1st dose)', description: 'First dose of Hepatitis B vaccine', ageInDays: 0, cost: 'Free / ₹100' },
  { vaccineName: 'OPV (Birth dose)', description: 'Oral Polio Vaccine - Birth dose', ageInDays: 0, cost: 'Free' },
  { vaccineName: 'DTP (1st dose)', description: 'Diphtheria, Tetanus, and Pertussis vaccine', ageInDays: 42, cost: 'Free / ₹250' },
  { vaccineName: 'Hib (1st dose)', description: 'Haemophilus influenzae type b vaccine', ageInDays: 42, cost: '₹400' },
  { vaccineName: 'Rotavirus (1st dose)', description: 'Rotavirus vaccine', ageInDays: 42, cost: '₹900' },
  { vaccineName: 'PCV (1st dose)', description: 'Pneumococcal Conjugate Vaccine', ageInDays: 42, cost: '₹1500–₹3000' },
  { vaccineName: 'IPV (1st dose)', description: 'Inactivated Polio Vaccine', ageInDays: 42, cost: 'Free / ₹500' },
  { vaccineName: 'DTP (2nd dose)', description: 'Second dose of DTP vaccine', ageInDays: 70, cost: 'Free / ₹250' },
  { vaccineName: 'Hib (2nd dose)', description: 'Second dose of Hib vaccine', ageInDays: 70, cost: '₹400' },
  { vaccineName: 'Rotavirus (2nd dose)', description: 'Second dose of Rotavirus vaccine', ageInDays: 70, cost: '₹900' },
  { vaccineName: 'PCV (2nd dose)', description: 'Second dose of PCV vaccine', ageInDays: 70, cost: '₹1500–₹3000' },
  { vaccineName: 'DTP (3rd dose)', description: 'Third dose of DTP vaccine', ageInDays: 98, cost: 'Free / ₹250' },
  { vaccineName: 'Hib (3rd dose)', description: 'Third dose of Hib vaccine', ageInDays: 98, cost: '₹400' },
  { vaccineName: 'Rotavirus (3rd dose)', description: 'Third dose of Rotavirus vaccine', ageInDays: 98, cost: '₹900' },
  { vaccineName: 'PCV (3rd dose)', description: 'Third dose of PCV vaccine', ageInDays: 98, cost: '₹1500–₹3000' },
  { vaccineName: 'IPV (2nd dose)', description: 'Second dose of IPV vaccine', ageInDays: 98, cost: 'Free / ₹500' },
  { vaccineName: 'MMR (1st dose)', description: 'Measles, Mumps, and Rubella vaccine', ageInDays: 270, cost: '₹70–₹200' },
  { vaccineName: 'Typhoid', description: 'Typhoid vaccine', ageInDays: 270, cost: '₹150–₹500' },
  { vaccineName: 'Hepatitis A (1st dose)', description: 'First dose of Hepatitis A vaccine', ageInDays: 365, cost: '₹900–₹1400' },
  { vaccineName: 'Varicella (1st dose)', description: 'Chickenpox vaccine', ageInDays: 365, cost: '₹1500–₹2000' },
  { vaccineName: 'MMR (2nd dose)', description: 'Second dose of MMR vaccine', ageInDays: 450, cost: '₹70–₹200' },
  { vaccineName: 'DTP Booster', description: 'DTP Booster dose', ageInDays: 480, cost: 'Free / ₹250' }
];

// Method to generate vaccination schedule for a new child
childSchema.methods.generateVaccinationSchedule = function() {
  const birthDate = new Date(this.dateOfBirth);
  
  this.vaccinationSchedule = DEFAULT_VACCINATION_SCHEDULE.map(vaccine => {
    const dueDate = new Date(birthDate);
    dueDate.setDate(birthDate.getDate() + vaccine.ageInDays);
    
    return {
      vaccineName: vaccine.vaccineName,
      description: vaccine.description,
      ageInDays: vaccine.ageInDays,
      dueDate: dueDate,
      cost: vaccine.cost,
      status: 'upcoming'
    };
  });
};

// Method to update vaccination statuses based on current date
childSchema.methods.updateVaccinationStatuses = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day
  
  this.vaccinationSchedule.forEach(vaccine => {
    if (vaccine.status === 'upcoming') {
      const dueDate = new Date(vaccine.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        vaccine.status = 'overdue';
      }
    }
  });
};

// Method to get vaccination summary
childSchema.methods.getVaccinationSummary = function() {
  const summary = {
    total: this.vaccinationSchedule.length,
    completed: 0,
    pending_approval: 0,
    upcoming: 0,
    overdue: 0
  };
  
  this.vaccinationSchedule.forEach(vaccine => {
    summary[vaccine.status]++;
  });
  
  return summary;
};

// Pre-save middleware
childSchema.pre('save', function() {
  this.updatedAt = Date.now();
  
  // Generate vaccination schedule if it doesn't exist
  if (this.isNew && this.vaccinationSchedule.length === 0) {
    this.generateVaccinationSchedule();
  }
  
  // Update vaccination statuses
  this.updateVaccinationStatuses();
});

module.exports = mongoose.model('Child', childSchema);
