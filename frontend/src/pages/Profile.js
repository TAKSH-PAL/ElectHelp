import React from 'react';
import { useAuthStore } from '../store/authStore';

const Profile = () => {
  const { user } = useAuthStore();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>
        
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">Username</label>
            <p className="text-white">{user?.username}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400">Email</label>
            <p className="text-white">{user?.email}</p>
          </div>
          
          {user?.profile?.firstName && (
            <div>
              <label className="block text-sm font-medium text-gray-400">Name</label>
              <p className="text-white">{user.profile.firstName} {user.profile.lastName}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-400">Reviews Submitted</label>
            <p className="text-white">{user?.activity?.reviewsSubmitted || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
