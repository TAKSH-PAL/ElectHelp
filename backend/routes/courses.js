const express = require('express');
const Course = require('../models/Course');
const Review = require('../models/Review');
const router = express.Router();

// GET /api/courses - Get all courses with filters
router.get('/', async (req, res) => {
  try {
    const { search, type, goal, sortBy = 'rating', page = 1, limit = 20 } = req.query;
    
    let filter = { isActive: true };
    if (search) filter.$text = { $search: search };
    if (type) filter.type = type;
    if (goal === 'trap') filter['flags.isTrapCourse'] = true;
    if (goal === 'no_exam') filter['flags.hasNoExam'] = true;

    let sort = {};
    if (sortBy === 'rating') sort = { 'statistics.avgRating': -1 };
    if (sortBy === 'chill') sort = { 'statistics.chillScore': -1 };
    if (sortBy === 'reviews') sort = { 'statistics.totalReviews': -1 };

    const skip = (page - 1) * limit;
    const [courses, total] = await Promise.all([
      Course.find(filter).sort(sort).skip(skip).limit(limit),
      Course.countDocuments(filter)
    ]);

    res.json({ success: true, data: { courses, total, page, totalPages: Math.ceil(total/limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/courses/:id - Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    
    const reviews = await Review.find({ course: req.params.id, isApproved: true })
      .populate('user', 'username').sort({ createdAt: -1 }).limit(10);
    
    res.json({ success: true, data: { course, reviews } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
