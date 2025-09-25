const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Challenge title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Challenge description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: ['water_conservation', 'soil_health', 'crop_rotation', 'organic_farming', 'energy_efficiency', 'waste_management'],
    required: [true, 'Challenge category is required']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'special'],
    default: 'daily'
  },
  points: {
    type: Number,
    required: [true, 'Points value is required'],
    min: [1, 'Points must be at least 1']
  },
  requirements: [{
    type: {
      type: String,
      enum: ['photo', 'document', 'survey', 'video', 'text'],
      required: true
    },
    description: String,
    required: Boolean
  }],
  instructions: [{
    step: Number,
    title: String,
    description: String,
    image: String
  }],
  resources: {
    videos: [String],
    articles: [String],
    tools: [String],
    tips: [String]
  },
  rewards: {
    points: Number,
    badges: [{
      badgeId: mongoose.Schema.Types.ObjectId,
      name: String,
      description: String,
      icon: String
    }],
    discounts: [{
      partner: String,
      percentage: Number,
      description: String,
      validUntil: Date
    }]
  },
  duration: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    timeLimit: Number // in minutes
  },
  eligibility: {
    roles: [{
      type: String,
      enum: ['farmer', 'student', 'dealer']
    }],
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'beginner'
    },
    location: {
      states: [String],
      districts: [String]
    }
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending'
    },
    submissions: [{
      type: {
        type: String,
        enum: ['photo', 'document', 'survey', 'video', 'text']
      },
      content: String,
      submittedAt: {
        type: Date,
        default: Date.now
      }
    }],
    pointsEarned: {
      type: Number,
      default: 0
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  statistics: {
    totalParticipants: { type: Number, default: 0 },
    completedParticipants: { type: Number, default: 0 },
    averageCompletionTime: Number, // in minutes
    successRate: Number // percentage
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
challengeSchema.index({ category: 1 });
challengeSchema.index({ difficulty: 1 });
challengeSchema.index({ type: 1 });
challengeSchema.index({ isActive: 1, isFeatured: 1 });
challengeSchema.index({ 'duration.startDate': 1, 'duration.endDate': 1 });

// Virtual for completion rate
challengeSchema.virtual('completionRate').get(function() {
  if (this.statistics.totalParticipants === 0) return 0;
  return (this.statistics.completedParticipants / this.statistics.totalParticipants) * 100;
});

// Virtual for days remaining
challengeSchema.virtual('daysRemaining').get(function() {
  if (!this.duration.endDate) return null;
  const now = new Date();
  const endDate = new Date(this.duration.endDate);
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Method to add participant
challengeSchema.methods.addParticipant = function(userId) {
  const existingParticipant = this.participants.find(p => p.userId.toString() === userId.toString());
  
  if (!existingParticipant) {
    this.participants.push({
      userId: userId,
      status: 'pending'
    });
    this.statistics.totalParticipants += 1;
  }
  
  return this.save();
};

// Method to update participant status
challengeSchema.methods.updateParticipantStatus = function(userId, status, submissions = []) {
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  
  if (participant) {
    participant.status = status;
    if (submissions.length > 0) {
      participant.submissions = submissions;
    }
    
    if (status === 'completed') {
      participant.completedAt = new Date();
      participant.pointsEarned = this.points;
      this.statistics.completedParticipants += 1;
    }
    
    // Calculate success rate
    this.statistics.successRate = this.completionRate;
  }
  
  return this.save();
};

// Method to check if user is eligible
challengeSchema.methods.isEligible = function(user) {
  // Check role eligibility
  if (this.eligibility.roles.length > 0 && !this.eligibility.roles.includes(user.role)) {
    return false;
  }
  
  // Check experience level
  if (this.eligibility.experience && user.farmingProfile.experience !== this.eligibility.experience) {
    return false;
  }
  
  // Check location eligibility
  if (this.eligibility.location.states.length > 0 && 
      !this.eligibility.location.states.includes(user.location.state)) {
    return false;
  }
  
  return true;
};

module.exports = mongoose.model('Challenge', challengeSchema);
