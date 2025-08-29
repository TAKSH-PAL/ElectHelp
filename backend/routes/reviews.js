const express = require('express');
const Review = require('../models/Review');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// POST /api/reviews - Create new review
router.post('/', authenticateToken, async (req, res) => {
  try {
    const review = new Review({ ...req.body, user: req.user.userId });
    await review.save();
    res.status(201).json({ success: true, data: { review } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reviews - Get reviews with filters
router.get('/', async (req, res) => {
  try {
    const { course, page = 1, limit = 10 } = req.query;
    let filter = { isApproved: true };
    if (course) filter.course = course;
    
    const skip = (page - 1) * limit;
    const reviews = await Review.find(filter)
      .populate('user', 'username')
      .populate('course', 'name courseId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({ success: true, data: { reviews } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
