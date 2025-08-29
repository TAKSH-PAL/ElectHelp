const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    name: { type: String, required: true, trim: true },
    teacherRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
  },
  rating: {
    overall: { type: Number, required: true, min: 1, max: 10 },
    teaching: { type: Number, min: 1, max: 10 },
    content: { type: Number, min: 1, max: 10 },
    difficulty: { type: Number, min: 1, max: 10 },
    workload: { type: Number, min: 1, max: 10 }
  },
  review: {
    title: { type: String, trim: true, maxlength: 100 },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    pros: [{ type: String, trim: true, maxlength: 200 }],
    cons: [{ type: String, trim: true, maxlength: 200 }],
    tips: [{ type: String, trim: true, maxlength: 200 }]
  },
  studyInfo: {
    studyHoursPerWeek: { type: Number, min: 0, max: 100 },
    studyTime: { type: String, trim: true, maxlength: 500 },
    attendanceRequired: { 
      type: String, 
      enum: ['Mandatory', 'Optional', 'Partially Required', 'Unknown'],
      default: 'Unknown'
    },
    examPattern: {
      type: String,
      enum: ['Written Exam', 'Assignment Only', 'Project Based', 'Presentation', 'Viva', 'Mixed', 'No Exam'],
      default: 'Written Exam'
    }
  },
  semester: {
    year: { type: Number, required: true, min: 2020, max: 2030 },
    term: { type: String, required: true, enum: ['Odd', 'Even', 'Summer'] }
  },
  wouldRecommend: { type: Boolean, required: true },
  isAnonymous: { type: Boolean, default: false },
  
  // Moderation fields
  isApproved: { type: Boolean, default: false },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderationNotes: { type: String, trim: true },
  flaggedReasons: [{ 
    type: String, 
    enum: ['Spam', 'Inappropriate Language', 'False Information', 'Personal Attack', 'Irrelevant'] 
  }],
  
  // Engagement metrics
  helpfulVotes: { type: Number, default: 0 },
  unhelpfulVotes: { type: Number, default: 0 },
  reports: { type: Number, default: 0 },
  
  // Metadata
  isEdited: { type: Boolean, default: false },
  editHistory: [{
    editedAt: { type: Date, default: Date.now },
    changes: { type: String, trim: true }
  }],
  
  // AI Analysis (populated by backend processing)
  aiAnalysis: {
    sentimentScore: { type: Number, min: -1, max: 1 }, // -1 very negative, 1 very positive
    keyTopics: [{ type: String }],
    suggestedTags: [{ type: String }],
    qualityScore: { type: Number, min: 0, max: 1 }, // Quality of review content
    languageCode: { type: String, default: 'en' }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for helpfulness ratio
reviewSchema.virtual('helpfulnessRatio').get(function() {
  const total = this.helpfulVotes + this.unhelpfulVotes;
  return total > 0 ? (this.helpfulVotes / total) : 0;
});

// Virtual for overall rating (fallback to rating.overall)
reviewSchema.virtual('overallRating').get(function() {
  return this.rating.overall;
});

// Virtual for review age
reviewSchema.virtual('reviewAge').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) return 'Today';
  if (diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
});

// Indexes for efficient queries
reviewSchema.index({ course: 1, isApproved: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ 'rating.overall': -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ helpfulVotes: -1 });
reviewSchema.index({ 'semester.year': -1, 'semester.term': 1 });
reviewSchema.index({ 'teacher.name': 'text', 'review.content': 'text' });

// Compound index for user-course uniqueness
reviewSchema.index({ user: 1, course: 1 }, { unique: true });

// Static method to find recent reviews
reviewSchema.statics.findRecent = function(limit = 10) {
  return this.find({ isApproved: true })
    .populate('user', 'username profile.firstName profile.lastName')
    .populate('course', 'name type courseId')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to find top helpful reviews
reviewSchema.statics.findMostHelpful = function(courseId, limit = 5) {
  const query = courseId ? { course: courseId, isApproved: true } : { isApproved: true };
  
  return this.find(query)
    .populate('user', 'username profile.firstName profile.lastName')
    .populate('course', 'name type courseId')
    .sort({ helpfulVotes: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to get statistics for a course
reviewSchema.statics.getCourseStats = async function(courseId) {
  const stats = await this.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId), isApproved: true } },
    {
      $group: {
        _id: '$course',
        totalReviews: { $sum: 1 },
        avgRating: { $avg: '$rating.overall' },
        avgTeaching: { $avg: '$rating.teaching' },
        avgContent: { $avg: '$rating.content' },
        avgDifficulty: { $avg: '$rating.difficulty' },
        avgWorkload: { $avg: '$rating.workload' },
        recommendationCount: {
          $sum: { $cond: [{ $eq: ['$wouldRecommend', true] }, 1, 0] }
        },
        avgStudyHours: { $avg: '$studyInfo.studyHoursPerWeek' }
      }
    }
  ]);

  if (stats.length === 0) return null;

  const result = stats[0];
  result.recommendationPercentage = (result.recommendationCount / result.totalReviews) * 100;
  
  return result;
};

// Method to calculate chill score based on review content
reviewSchema.methods.calculateChillScore = function() {
  const content = `${this.review.content} ${this.studyInfo.studyTime}`.toLowerCase();
  
  const chillKeywords = [
    'chill', 'easy', 'no stress', 'no exam', 'no paper', 'presentation', 
    'kam padna', 'last day', 'ek raat', '0 hours', '1-2 hours', 'no assignment'
  ];
  
  const stressKeywords = [
    'strict', 'hectic', 'daily', 'compulsory', '75%', 'difficult', 
    'tough', 'hard', 'stressful', 'intensive'
  ];

  let score = 5; // Base score
  
  chillKeywords.forEach(keyword => {
    if (content.includes(keyword)) score += 0.5;
  });
  
  stressKeywords.forEach(keyword => {
    if (content.includes(keyword)) score -= 1;
  });

  return Math.max(0, Math.min(10, score));
};

// Pre-save middleware to auto-approve reviews from verified users
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    const User = mongoose.model('User');
    const user = await User.findById(this.user);
    
    // Auto-approve reviews from verified users with good standing
    if (user && user.isEmailVerified && user.activity.reviewsSubmitted < 50) {
      this.isApproved = true;
    }
  }
  
  next();
});

// Post-save middleware to update course statistics
reviewSchema.post('save', async function() {
  if (this.isApproved) {
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.course);
    if (course) {
      await course.updateStatistics();
    }
  }
});

module.exports = mongoose.model('Review', reviewSchema);
