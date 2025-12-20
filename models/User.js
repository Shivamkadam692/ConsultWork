const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES, WORKER_VERIFICATION_STATUS, AVAILABILITY_STATUS } = require('../config/constants');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: [USER_ROLES.CLIENT, USER_ROLES.WORKER, USER_ROLES.ADMIN],
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  profileImage: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Worker-specific fields
  serviceAreas: [{
    city: String,
    radius: Number // km
  }],
  rates: {
    hourly: Number,
    daily: Number,
    projectBased: Boolean
  },
  availability: {
    schedule: [{
      day: String,
      timeSlots: [{
        start: String,
        end: String
      }]
    }],
    status: {
      type: String,
      enum: Object.values(AVAILABILITY_STATUS),
      default: AVAILABILITY_STATUS.AVAILABLE
    }
  },
  skills: [{
    category: String,
    subcategory: String,
    experience: Number // years of experience
  }],
  portfolio: [String], // image URLs
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    document: String // URL
  }],
  verificationStatus: {
    type: String,
    enum: Object.values(WORKER_VERIFICATION_STATUS),
    default: WORKER_VERIFICATION_STATUS.PENDING
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'address.coordinates': '2dsphere' });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);

