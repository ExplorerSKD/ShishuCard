const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['parent', 'doctor', 'admin'], 
    required: true 
  },
  
  // Doctor-specific fields
  isApproved: { 
    type: Boolean, 
    default: function() {
      return this.role !== 'doctor'; // Auto-approve parents and admins
    }
  },
  medicalLicense: { 
    type: String, 
    required: function() { return this.role === 'doctor'; }
  },
  hospitalAffiliation: { 
    type: String, 
    required: function() { return this.role === 'doctor'; }
  },
  specialization: { 
    type: String, 
    required: function() { return this.role === 'doctor'; }
  },
  yearsOfExperience: { 
    type: Number, 
    required: function() { return this.role === 'doctor'; }
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  
  // Parent-specific fields
  phone: { 
    type: String, 
    required: function() { return this.role === 'parent'; }
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  
  // Profile status
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving (only if password is modified)
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password for local login
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
