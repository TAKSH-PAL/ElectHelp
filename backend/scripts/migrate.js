const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Course = require('../models/Course');
const Review = require('../models/Review');
const User = require('../models/User');
require('dotenv').config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/course_recommendation');
    
    // Read existing JSON data
    const jsonPath = path.join(__dirname, '../courses_advanced.json');
    const coursesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`Migrating ${coursesData.length} courses...`);
    
    let totalReviewsCreated = 0;

    for (const courseData of coursesData) {
      // Calculate recommendation percentage
      let totalReviews = 0;
      let recommendedReviews = 0;
      
      Object.values(courseData.teachers || {}).forEach(teacherData => {
        (teacherData.reviews || []).forEach(review => {
          totalReviews++;
          if (review.rating >= 7) recommendedReviews++;
        });
      });
      
      const recommendationPercentage = totalReviews > 0 ? Math.round((recommendedReviews / totalReviews) * 100) : 0;
      
      // Create course
      const course = await Course.findOneAndUpdate(
        { courseId: courseData.id },
        {
          courseId: courseData.id,
          name: courseData.name,
          type: courseData.type || 'FEC',
          statistics: {
            avgRating: isNaN(courseData.avg_rating) ? 0 : (courseData.avg_rating || 0),
            totalReviews: isNaN(courseData.review_count) ? 0 : (courseData.review_count || 0),
            chillScore: isNaN(courseData.chill_score) ? 5 : (courseData.chill_score || 5),
            recommendationPercentage: recommendationPercentage
          },
          flags: {
            isTrapCourse: courseData.is_trap_course || false,
            hasNoExam: courseData.name.toLowerCase().includes('sports') || courseData.name.toLowerCase().includes('public speaking'),
            isPopular: courseData.avg_rating >= 9
          },
          teachers: Object.keys(courseData.teachers || {}).map(name => ({
            name,
            rating: courseData.teachers[name].avg_rating || 0,
            reviewCount: courseData.teachers[name].reviews?.length || 0
          }))
        },
        { upsert: true, new: true }
      );
      
      // Create reviews for each teacher with completely unique users
      for (const [teacherName, teacherData] of Object.entries(courseData.teachers || {})) {
        for (let reviewIdx = 0; reviewIdx < (teacherData.reviews || []).length; reviewIdx++) {
          const reviewData = teacherData.reviews[reviewIdx];
          const globalReviewId = `c${courseData.id}t${Object.keys(courseData.teachers).indexOf(teacherName)}r${reviewIdx}`;
          
          // Create a completely unique user for each review
          const reviewUser = await User.findOneAndUpdate(
            { email: `student_${globalReviewId}@dtu.ac.in` },
            {
              username: `student_${globalReviewId}`,
              email: `student_${globalReviewId}@dtu.ac.in`,
              password: 'hashedpass123',
              isEmailVerified: true,
              profile: {
                firstName: 'Anonymous',
                lastName: 'Student',
                branch: 'Various',
                year: Math.floor(Math.random() * 4) + 1
              },
              isAnonymous: true
            },
            { upsert: true, new: true }
          );
          
          // Create the review with error handling
          try {
            const newReview = await Review.create({
              user: reviewUser._id,
              course: course._id,
              teacher: { 
                name: teacherName,
                teacherRef: null 
              },
              rating: {
                overall: Math.max(1, Math.min(10, reviewData.rating || 5)),
                teaching: Math.max(1, Math.min(10, reviewData.rating || 5)),
                content: Math.max(1, Math.min(10, reviewData.rating || 5)),
                difficulty: Math.max(1, Math.min(10, 11 - (reviewData.rating || 5))),
                workload: Math.max(1, Math.min(10, Math.floor(Math.random() * 4) + 4))
              },
              review: {
                title: `Review for ${courseData.name}`,
                content: reviewData.review || 'No specific review provided.',
                pros: [],
                cons: [],
                tips: []
              },
              studyInfo: {
                studyTime: reviewData.study_time || 'Time requirement not specified',
                attendanceRequired: reviewData.study_time?.toLowerCase().includes('attendance') ? 'Mandatory' : 'Unknown',
                examPattern: reviewData.study_time?.toLowerCase().includes('no exam') ? 'No Exam' : 'Written Exam',
                studyHoursPerWeek: Math.floor(Math.random() * 20) + 1
              },
              semester: {
                year: 2023,
                term: 'Odd'
              },
              wouldRecommend: (reviewData.rating || 5) >= 7,
              isAnonymous: true,
              isApproved: true,
              helpfulVotes: Math.floor(Math.random() * 10),
              unhelpfulVotes: Math.floor(Math.random() * 3),
              reports: 0,
              createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
            });
            
            totalReviewsCreated++;
            
          } catch (err) {
            if (err.code === 11000) {
              console.log(`  ⚠️ Skipping duplicate review for ${teacherName} (${err.message})`);
            } else {
              console.error(`  ❌ Error creating review for ${teacherName}:`, err.message);
            }
          }
        }
      }
      
      console.log(`✓ Created course: ${courseData.name} (${Object.values(courseData.teachers || {}).reduce((sum, t) => sum + (t.reviews?.length || 0), 0)} reviews)`);
    }
    
    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📊 Total courses: ${coursesData.length}`);
    console.log(`📝 Total reviews: ${totalReviewsCreated}`);
    process.exit(0);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
