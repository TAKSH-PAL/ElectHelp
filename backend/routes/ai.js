const express = require('express');
const router = express.Router();

// POST /api/ai/summary - Generate course summary
router.post('/summary', async (req, res) => {
  try {
    const { reviews, courseName } = req.body;
    const prompt = `Summarize these reviews for ${courseName}: ${reviews.join(' ')}`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const result = await response.json();
    const summary = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate summary';
    
    res.json({ success: true, data: { summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
