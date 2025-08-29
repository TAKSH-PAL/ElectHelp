import React from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, FlagIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

const CourseCard = ({ course }) => {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIcon key={i} className="h-4 w-4 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarIcon key="half" className="h-4 w-4 text-yellow-400 opacity-50" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarOutline key={`empty-${i}`} className="h-4 w-4 text-gray-600" />);
    }

    return stars;
  };

  const getChillColor = (score) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <Link
      to={`/course/${course._id}`}
      className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 cursor-pointer group"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-emerald-400">
                {course.type} {course.courseId}
              </span>
              {course.flags?.isTrapCourse && (
                <FlagIcon className="h-4 w-4 text-red-500 animate-pulse" title="Trap Course" />
              )}
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
              {course.name}
            </h3>
          </div>
          
          <div className="text-right ml-4">
            <div className="text-2xl font-bold text-white">
              {course.statistics?.avgRating?.toFixed(1) || '0.0'}
            </div>
            <div className="flex items-center justify-end mb-1">
              {renderStars(course.statistics?.avgRating || 0)}
            </div>
            <div className="text-xs text-gray-500">
              {course.statistics?.totalReviews || 0} reviews
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          {/* Chill Score */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Chill Score:</span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(course.statistics?.chillScore || 0) * 10}%` }}
                />
              </div>
              <span className={`font-bold text-sm ${getChillColor(course.statistics?.chillScore || 0)}`}>
                {course.statistics?.chillScore?.toFixed(1) || '0.0'}
              </span>
            </div>
          </div>

          {/* Tags */}
          {course.flags && (
            <div className="flex flex-wrap gap-1">
              {course.flags.hasNoExam && (
                <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                  No Exam
                </span>
              )}
              {course.flags.isPopular && (
                <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full">
                  Popular
                </span>
              )}
              {course.flags.isProjectBased && (
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                  Project Based
                </span>
              )}
            </div>
          )}

          {/* Teachers */}
          {course.teachers && course.teachers.length > 0 && (
            <div className="text-xs text-gray-400">
              <span className="font-medium">Teachers: </span>
              {course.teachers.slice(0, 2).map(teacher => teacher.name).join(', ')}
              {course.teachers.length > 2 && ` +${course.teachers.length - 2} more`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
          <span>Click for details</span>
          <div className="flex items-center gap-1">
            <ChatBubbleLeftIcon className="h-3 w-3" />
            <span>View Reviews</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
