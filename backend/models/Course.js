const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    required: true,
    enum: ['FEC', 'OE', 'PE', 'MOOC'],
    default: 'FEC'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  credits: {
    type: Number,
    min: 0,
    max: 10,
    default: 2
  },
  department: {
    type: String,
    trim: true
  },
  prerequisites: [{ type: String }],
  syllabus: {
    topics: [{ type: String }],
    learningOutcomes: [{ type: String }],
    assessmentPattern: {
      midsem: { type: Number, default: 25 },
      endsem: { type: Number, default: 50 },
      internal: { type: Number, default: 25 }
    }
  },
  teachers: [{
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    rating: { type: Number, default: 0, min: 0, max: 10 },
    reviewCount: { type: Number, default: 0 }
  }],
  statistics: {
    avgRating: { type: Number, default: 0, min: 0, max: 10 },
    totalReviews: { type: Number, default: 0 },
    chillScore: { type: Number, default: 5, min: 0, max: 10 },
    difficultyLevel: { 
      type: String, 
      enum: ['Very Easy', 'Easy', 'Moderate', 'Hard', 'Very Hard'],
      default: 'Moderate'
    },
    passingRate: { type: Number, default: 0, min: 0, max: 100 },
    averageStudyHours: { type: Number, default: 0 },
    recommendationPercentage: { type: Number, default: 0, min: 0, max: 100 }
  },
  flags: {
    isTrapCourse: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    hasNoExam: { type: Boolean, default: false },
    isProjectBased: { type: Boolean, default: false }
  },
  schedule: {
    semester: [{ type: String, enum: ['Odd', 'Even', 'Both'] }],
    timeSlots: [{ type: String }],
    duration: { type: String, default: '1 Semester' }
  },
  tags: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for course identifier
courseSchema.virtual('identifier').get(function() {
  return `${this.type}-${this.courseId}`;
});

// Virtual for difficulty badge color
courseSchema.virtual('difficultyColor').get(function() {
  const colors = {
    'Very Easy': 'green',
    'Easy': 'light-green',
    'Moderate': 'yellow',
    'Hard': 'orange',
    'Very Hard': 'red'
  };
  return colors[this.statistics.difficultyLevel] || 'gray';
});

// Indexes for efficient queries
courseSchema.index({ courseId: 1 });
courseSchema.index({ name: 'text', type: 'text', 'teachers.name': 'text' });
courseSchema.index({ type: 1 });
courseSchema.index({ 'statistics.avgRating': -1 });
courseSchema.index({ 'statistics.chillScore': -1 });
courseSchema.index({ 'statistics.totalReviews': -1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ isActive: 1 });

// Static method to find courses by rating range
courseSchema.statics.findByRatingRange = function(minRating, maxRating) {
  return this.find({
    'statistics.avgRating': { $gte: minRating, $lte: maxRating },
    isActive: true
  });
};

// Static method to find popular courses
courseSchema.statics.findPopular = function(limit = 10) {
  return this.find({ 
    'flags.isPopular': true, 
    isActive: true 
  })
  .sort({ 'statistics.totalReviews': -1 })
  .limit(limit);
};

// Static method to find trap courses
courseSchema.statics.findTrapCourses = function() {
  return this.find({ 
    'flags.isTrapCourse': true, 
    isActive: true 
  })
  .sort({ 'statistics.avgRating': 1 });
};

// Method to calculate and update statistics
courseSchema.methods.updateStatistics = async function() {
  const Review = mongoose.model('Review');
  
  const reviews = await Review.find({ 
    course: this._id,
    isApproved: true 
  });

  if (reviews.length === 0) {
    this.statistics.totalReviews = 0;
    this.statistics.avgRating = 0;
    return this.save();
  }

  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  this.statistics.avgRating = parseFloat((totalRating / reviews.length).toFixed(1));
  
  // Calculate total reviews
  this.statistics.totalReviews = reviews.length;
  
  // Calculate recommendation percentage
  const recommendedReviews = reviews.filter(review => review.wouldRecommend).length;
  this.statistics.recommendationPercentage = reviews.length > 0 ? 
    Math.round((recommendedReviews / reviews.length) * 100) : 0;

  // Update flags
  this.flags.isTrapCourse = this.statistics.avgRating < 4 && this.statistics.totalReviews >= 3;
  this.flags.isPopular = this.statistics.totalReviews >= 10 && this.statistics.avgRating >= 7;

  return this.save();
};

// Pre-save middleware to update search tags
courseSchema.pre('save', function(next) {
  // Auto-generate tags based on course data
  const autoTags = [];
  
  if (this.flags.hasNoExam) autoTags.push('no-exam');
  if (this.flags.isProjectBased) autoTags.push('project-based');
  if (this.statistics.chillScore >= 8) autoTags.push('chill');
  if (this.statistics.chillScore <= 3) autoTags.push('intensive');
  if (this.statistics.avgRating >= 8.5) autoTags.push('highly-rated');
  
  // Add unique tags only
  this.tags = [...new Set([...this.tags, ...autoTags])];
  
  next();
});

module.exports = mongoose.model('Course', courseSchema);
