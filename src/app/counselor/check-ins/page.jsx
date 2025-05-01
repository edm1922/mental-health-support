'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import CounselorNavbar from '@/components/ui/CounselorNavbar';
import { format } from 'date-fns';

export default function CounselorCheckIns() {
  const [loading, setLoading] = useState(true);
  const [checkIns, setCheckIns] = useState([]);
  const [users, setUsers] = useState({});
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'date-asc', 'mood-asc', 'mood-desc'
  const [selectedUser, setSelectedUser] = useState('all');
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    fetchCheckIns();
  }, [filter, sortBy, selectedUser]);

  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      
      // Get current date for filtering
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
      
      // Build query
      let query = supabase
        .from('daily_check_ins')
        .select('*, user_id');
      
      // Apply date filter
      if (filter === 'today') {
        query = query.gte('created_at', today);
      } else if (filter === 'week') {
        query = query.gte('created_at', weekAgo);
      } else if (filter === 'month') {
        query = query.gte('created_at', monthAgo);
      }
      
      // Apply user filter
      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser);
      }
      
      // Apply sorting
      if (sortBy === 'date-desc') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'date-asc') {
        query = query.order('created_at', { ascending: true });
      } else if (sortBy === 'mood-asc') {
        query = query.order('mood_rating', { ascending: true });
      } else if (sortBy === 'mood-desc') {
        query = query.order('mood_rating', { ascending: false });
      }
      
      const { data: checkInsData, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Get unique user IDs
      const userIds = [...new Set(checkInsData.map(checkIn => checkIn.user_id))];
      
      // Fetch user profiles
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', userIds);
      
      if (usersError) {
        throw usersError;
      }
      
      // Create a map of user IDs to user names
      const usersMap = {};
      usersData.forEach(user => {
        usersMap[user.id] = user.display_name;
      });
      
      setCheckIns(checkInsData);
      setUsers(usersMap);
      
      // Get all users for the filter dropdown
      const { data: allUsers, error: allUsersError } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .eq('role', 'user');
      
      if (allUsersError) {
        throw allUsersError;
      }
      
      setUsersList(allUsers);
      
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (rating) => {
    if (!rating && rating !== 0) return '❓';
    
    const emojis = ['😭', '😢', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '😍'];
    return emojis[Math.min(Math.max(Math.floor(rating), 0), 9)];
  };

  const getMoodColor = (rating) => {
    if (!rating && rating !== 0) return 'bg-gray-100';
    
    if (rating < 3) return 'bg-red-100 text-red-800';
    if (rating < 5) return 'bg-orange-100 text-orange-800';
    if (rating < 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CounselorNavbar />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Client Check-ins</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="mood-asc">Mood (Low to High)</option>
                <option value="mood-desc">Mood (High to Low)</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <select
                id="user"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="all">All Clients</option>
                {usersList.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : checkIns.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No check-ins found for the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mood
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sleep
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activities
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {checkIns.map((checkIn) => (
                    <tr key={checkIn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(checkIn.created_at), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {users[checkIn.user_id] || 'Unknown User'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{getMoodEmoji(checkIn.mood_rating)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMoodColor(checkIn.mood_rating)}`}>
                            {checkIn.mood_rating}/9
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {checkIn.notes || 'No notes provided'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {checkIn.sleep_hours ? `${checkIn.sleep_hours} hours` : 'Not recorded'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {checkIn.activities ? (
                          <div className="flex flex-wrap gap-1">
                            {checkIn.activities.map((activity, index) => (
                              <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                                {activity}
                              </span>
                            ))}
                          </div>
                        ) : (
                          'None recorded'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
