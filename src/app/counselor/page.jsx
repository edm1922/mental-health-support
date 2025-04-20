"use client";
import React, { useState, useEffect } from "react";
import { useUser } from '@/utils/useUser';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';
import { Card, CardHeader, CardContent, StatsCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export default function CounselorDashboard() {
  const { data: user } = useUser();
  const [stats, setStats] = useState({
    activeSessions: 0,
    pendingSessions: 0,
    completedSessions: 0,
    totalPatients: 0,
    recentCheckins: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get counselor sessions stats
      const { data: sessions, error: sessionsError } = await supabase
        .from('counseling_sessions')
        .select('*')
        .eq('counselor_id', user.id);

      if (sessionsError) throw sessionsError;

      const activeSessions = sessions?.filter(s => s.status === 'active' || s.status === 'scheduled').length || 0;
      const pendingSessions = sessions?.filter(s => s.status === 'pending').length || 0;
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;

      // Get unique patients
      const uniquePatientIds = [...new Set(sessions?.map(s => s.patient_id) || [])];
      const totalPatients = uniquePatientIds.length;

      // Get upcoming sessions (scheduled or pending)
      const upcoming = sessions
        ?.filter(s => s.status === 'scheduled' || s.status === 'pending')
        .sort((a, b) => new Date(a.scheduled_time || a.created_at) - new Date(b.scheduled_time || b.created_at))
        .slice(0, 5) || [];

      // Get patient information for upcoming sessions
      const patientIds = upcoming.map(s => s.patient_id);
      const { data: patients, error: patientsError } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', patientIds);

      if (patientsError) throw patientsError;

      // Map patient names to sessions
      const upcomingWithNames = upcoming.map(session => {
        const patient = patients?.find(p => p.id === session.patient_id);
        return {
          ...session,
          patientName: patient?.display_name || 'Unknown Patient'
        };
      });

      // Get recent check-ins from patients
      let checkins = [];
      let checkinsError = null;

      try {
        // First try using the nested select approach
        const { data, error } = await supabase
          .from('mental_health_checkins')
          .select('*, user_profiles(display_name)')
          .in('user_id', uniquePatientIds)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error) {
          checkins = data;
        } else if (error.message.includes('relationship') || error.message.includes('does not exist')) {
          // If there's a relationship error, use the view instead
          console.log('Using mental_health_checkins_with_users view as fallback');
          const { data: viewData, error: viewError } = await supabase
            .from('mental_health_checkins_with_users')
            .select('*')
            .in('user_id', uniquePatientIds)
            .order('created_at', { ascending: false })
            .limit(5);

          if (viewError) {
            throw viewError;
          }

          // Transform the data to match the expected format
          checkins = viewData.map(item => ({
            ...item,
            user_profiles: {
              display_name: item.display_name
            }
          }));
        } else {
          throw error;
        }
      } catch (err) {
        console.error('Error fetching check-ins:', err);
        checkinsError = err;
      }

      if (checkinsError) throw checkinsError;

      setStats({
        activeSessions,
        pendingSessions,
        completedSessions,
        totalPatients,
        recentCheckins: checkins?.length || 0
      });

      setUpcomingSessions(upcomingWithNames);
      setRecentCheckins(checkins || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMoodEmoji = (mood) => {
    switch (mood?.toLowerCase()) {
      case 'very bad': return '😢';
      case 'bad': return '😔';
      case 'neutral': return '😐';
      case 'good': return '🙂';
      case 'very good': return '😄';
      default: return '❓';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Counselor Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your sessions and patient check-ins</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeSessions}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingSessions}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full">
                  <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/counselor/sessions" className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Manage Sessions</span>
              </Link>

              <Link href="/counselor/patients" className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100">
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">View Patient Check-ins</span>
              </Link>

              <Link href="/counselor/profile" className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100">
                <svg className="h-5 w-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Update Profile</span>
              </Link>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Sessions</h2>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">No upcoming sessions</p>
                  <Link href="/counselor/sessions" className="mt-3 inline-block text-sm text-green-600 hover:text-green-800">
                    View all sessions
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map((session, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{session.patientName}</p>
                          <p className="text-sm text-gray-500">{formatDate(session.scheduled_time || session.created_at)}</p>
                        </div>
                        <div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            session.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {session.status === 'scheduled' ? 'Scheduled' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <Link
                          href={`/counselor/sessions/${session.id}`}
                          className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded"
                        >
                          View Details
                        </Link>
                        {session.video_enabled && (
                          <Link
                            href={session.video_join_url || '#'}
                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded"
                          >
                            Join Video
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 text-right">
                <Link href="/counselor/sessions" className="text-sm text-green-600 hover:text-green-800">
                  View all sessions →
                </Link>
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Patient Check-ins</h2>
              {recentCheckins.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No recent check-ins</p>
                  <Link href="/counselor/patients" className="mt-3 inline-block text-sm text-green-600 hover:text-green-800">
                    View all patient check-ins
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCheckins.map((checkin, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-800">
                            {checkin.user_profiles?.display_name || 'Unknown Patient'}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(checkin.created_at)}</p>
                        </div>
                        <div className="text-2xl">
                          {getMoodEmoji(checkin.mood)}
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {checkin.notes || 'No notes provided'}
                        </p>
                      </div>
                      <div className="mt-2">
                        <Link
                          href={`/counselor/patients?user_id=${checkin.user_id}`}
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded"
                        >
                          View Patient History
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 text-right">
                <Link href="/counselor/patients" className="text-sm text-green-600 hover:text-green-800">
                  View all patient check-ins →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
