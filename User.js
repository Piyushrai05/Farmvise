const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  role: {
    type: String,
    enum: ['farmer', 'student', 'dealer', 'admin'],
    default: 'farmer'
  },
  profileImage: {
    type: String,
    default: ''
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  socialLogin: {
    google: {
      id: String,
      verified: Boolean
    },
    facebook: {
      id: String,
      verified: Boolean
    }
  },
  preferences: {
    language: {
      type: String,
      enum: ['en', 'hi', 'ta', 'te', 'bn'],
      default: 'en'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  },
  location: {
    state: String,
    district: String,
    village: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  farmingProfile: {
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'beginner'
    },
    farmSize: Number, // in acres
    crops: [String],
    irrigationType: {
      type: String,
      enum: ['traditional', 'drip', 'sprinkler', 'mixed']
    }
  },
  gamification: {
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    badges: [{
      badgeId: mongoose.Schema.Types.ObjectId,
      earnedAt: Date,
      description: String
    }],
    streak: { type: Number, default: 0 },
    lastActiveDate: Date
  },
  wallet: {
    balance: { type: Number, default: 0 },
    transactions: [{
      type: {
        type: String,
        enum: ['earned', 'spent', 'reward', 'purchase']
      },
      amount: Number,
      description: String,
      date: { type: Date, default: Date.now }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ 'gamification.points': -1 });
userSchema.index({ 'gamification.level': -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  };
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(otp) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return false;
  }
  
  if (this.otp.expiresAt < new Date()) {
    return false;
  }
  
  return this.otp.code === otp;
};

// Method to clear OTP
userSchema.methods.clearOTP = function() {
  this.otp = undefined;
};

// Method to add points
userSchema.methods.addPoints = function(points, description = 'Points earned') {
  this.gamification.points += points;
  this.gamification.experience += points;
  
  // Check for level up
  const newLevel = Math.floor(this.gamification.experience / 1000) + 1;
  if (newLevel > this.gamification.level) {
    this.gamification.level = newLevel;
  }
  
  // Add to wallet
  this.wallet.balance += points;
  this.wallet.transactions.push({
    type: 'earned',
    amount: points,
    description
  });
  
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
