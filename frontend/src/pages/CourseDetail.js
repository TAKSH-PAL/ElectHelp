import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import { StarIcon, SparklesIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/LoadingSpinner';

const CourseDetail = () => {
  const { id } = useParams();
  const [aiSummary, setAiSummary] = useState('');

  const { data: course, isLoading, error } = useQuery(
    ['course', id],
    () => axios.get(`/courses/${id}`).then(res => res.data.data)
  );

  const generateSummary = useMutation(
    async () => {
      const reviews = course.reviews.map(r => r.review.content);
      const response = await axios.post('/ai/summary', {
        reviews,
        courseName: course.course.name
      });
      return response.data.data.summary;
    },
    {
      onSuccess: (summary) => {
        setAiSummary(summary);
      }
    }
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-400 text-center py-8">Error loading course</div>;

  const { course: courseData, reviews } = course;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Course Header */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-emerald-400 font-semibold">
                {courseData.type} {courseData.courseId}
              </span>
              <h1 className="text-3xl font-bold text-white mt-2">{courseData.name}</h1>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {courseData.statistics?.avgRating?.toFixed(1) || '0.0'}
              </div>
              <div className="flex items-center justify-end">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(courseData.statistics?.avgRating || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-400">
                {courseData.statistics?.totalReviews || 0} reviews
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Chill Score</div>
              <div className="text-2xl font-bold text-emerald-400">
                {courseData.statistics?.chillScore?.toFixed(1) || '0.0'}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Difficulty</div>
              <div className="text-lg font-semibold text-white">
                {courseData.statistics?.difficultyLevel || 'Moderate'}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Recommendation Rate</div>
              <div className="text-2xl font-bold text-white">
                {courseData.statistics?.recommendationPercentage || 0}%
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-purple-400" />
                AI Course Summary
              </h3>
              <button
                onClick={() => generateSummary.mutate()}
                disabled={generateSummary.isLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50"
              >
                {generateSummary.isLoading ? 'Generating...' : 'Generate Summary'}
              </button>
            </div>
            {aiSummary && (
              <div className="text-gray-300 bg-gray-800/50 p-4 rounded-md">
                {aiSummary}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Student Reviews</h2>
          
          {reviews.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              No reviews available for this course yet.
            </div>
          ) : (
            reviews.map((review, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">
                        {review.user?.username || 'Anonymous'}
                      </span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-400">
                        {review.teacher?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating.overall
                              ? 'text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-semibold text-white">
                        {review.rating.overall}/10
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-gray-300 mb-4">
                  {review.review.content}
                </div>

                {review.studyInfo?.studyTime && (
                  <div className="text-sm text-gray-400 bg-gray-700/50 p-3 rounded-md">
                    <strong>Study Time:</strong> {review.studyInfo.studyTime}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
