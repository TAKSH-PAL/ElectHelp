import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const [search, setSearch] = useState('');
  const [goal, setGoal] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery(
    ['courses', { search, goal, sortBy, page }],
    async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (goal !== 'all') params.append('goal', goal);
      params.append('sortBy', sortBy);
      params.append('page', page);
      params.append('limit', 12);

      const response = await axios.get(`/courses?${params}`);
      return response.data.data;
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-400">Error loading courses: {error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" style={{maxWidth: '1200px', margin: '0 auto', padding: '32px 16px'}}>
      {/* Header */}
      <div className="text-center mb-8" style={{textAlign: 'center', marginBottom: '32px'}}>
        <h1 className="text-4xl font-bold text-white mb-4" style={{color: '#ffffff', fontSize: '2.5rem', fontWeight: '700', marginBottom: '16px', lineHeight: '1.1'}}>
          Find Your Perfect DTU Elective
        </h1>
        <p className="text-gray-400 text-lg" style={{color: '#9ca3af', fontSize: '1.125rem', lineHeight: '1.6'}}>
          Data-driven insights from fellow students to help you choose wisely
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8" style={{backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', padding: '24px', marginBottom: '32px'}}>
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4" style={{display: 'grid', gridTemplateColumns: '1fr', gap: '16px'}}>
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-1" style={{fontSize: '14px', fontWeight: '500', color: '#9CA3AF', marginBottom: '4px'}}>
              Search Courses
            </label>
            <div className="relative" style={{position: 'relative'}}>
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', height: '16px', width: '16px', color: '#9ca3af'}} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID, or teacher..."
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border-gray-600 text-white rounded-md focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                style={{width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', backgroundColor: '#374151', border: '1px solid #4b5563', color: '#ffffff', borderRadius: '6px', fontSize: '16px', outline: 'none'}}
              />
            </div>
          </div>

          {/* Goal Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1" style={{fontSize: '14px', fontWeight: '500', color: '#9CA3AF', marginBottom: '4px'}}>
              Goal
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full py-3 bg-gray-700 border-gray-600 text-white rounded-md focus:ring-2 focus:ring-emerald-400"
              style={{width: '100%', padding: '12px 16px', backgroundColor: '#374151', border: '1px solid #4b5563', color: '#ffffff', borderRadius: '6px', fontSize: '16px', outline: 'none'}}
            >
              <option value="all">All Courses</option>
              <option value="no_exam">No Written Exams</option>
              <option value="trap">Show "Trap" Courses 🚩</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1" style={{fontSize: '14px', fontWeight: '500', color: '#9CA3AF', marginBottom: '4px'}}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-3 bg-gray-700 border-gray-600 text-white rounded-md focus:ring-2 focus:ring-emerald-400"
              style={{width: '100%', padding: '12px 16px', backgroundColor: '#374151', border: '1px solid #4b5563', color: '#ffffff', borderRadius: '6px', fontSize: '16px', outline: 'none'}}
            >
              <option value="rating">Rating: High to Low</option>
              <option value="chill">Chill Score: High to Low</option>
              <option value="reviews">Most Reviewed</option>
            </select>
          </div>
        </form>
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-400">
              Found {data?.total || 0} courses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {data?.courses?.map((course) => (
              <CourseCard key={course._id} course={course} />
            )) || []}
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              {page > 1 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                >
                  Previous
                </button>
              )}
              
              <span className="px-4 py-2 bg-emerald-600 rounded-md">
                {page} of {data.totalPages}
              </span>
              
              {page < data.totalPages && (
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
