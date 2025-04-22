"use client";
import React, { useState, useEffect } from "react";
import { useUser } from '@/utils/useUser';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';
import { Card, CardHeader, CardContent, StatsCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <h1 className="text-3xl font-bold text-gray-800">Counselor Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your sessions and patient check-ins</p>
        </div>

      {error && (
        <div className="mb-8 bg-red-50 p-6 rounded-xl shadow-md border border-red-200 text-red-600">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Error Occurred</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-green-500 mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border-t-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    Active Sessions
                    <span className="ml-2 text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Current</span>
                  </p>
                  <div className="flex items-baseline mt-1">
                    <p className="text-3xl font-bold text-gray-900">{stats.activeSessions}</p>
                    <p className="ml-2 text-xs text-gray-500">sessions</p>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-md">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border-t-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    Pending Sessions
                    <span className="ml-2 text-xs text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-full">Waiting</span>
                  </p>
                  <div className="flex items-baseline mt-1">
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingSessions}</p>
                    <p className="ml-2 text-xs text-gray-500">requests</p>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-md">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border-t-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    Completed Sessions
                    <span className="ml-2 text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Finished</span>
                  </p>
                  <div className="flex items-baseline mt-1">
                    <p className="text-3xl font-bold text-gray-900">{stats.completedSessions}</p>
                    <p className="ml-2 text-xs text-gray-500">total</p>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-md">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border-t-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    Total Patients
                    <span className="ml-2 text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">Active</span>
                  </p>
                  <div className="flex items-baseline mt-1">
                    <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
                    <p className="ml-2 text-xs text-gray-500">patients</p>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-md">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/counselor/sessions" className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-200 hover:shadow-md transition-all duration-300">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Manage Sessions</span>
                  <p className="text-xs text-gray-500 mt-1">View and update your counseling sessions</p>
                </div>
              </Link>

              <Link href="/counselor/patients" className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Patient Check-ins</span>
                  <p className="text-xs text-gray-500 mt-1">Review your patients' mental health updates</p>
                </div>
              </Link>

              <Link href="/counselor/profile" className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-200 hover:shadow-md transition-all duration-300">
                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Update Profile</span>
                  <p className="text-xs text-gray-500 mt-1">Manage your counselor profile information</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upcoming Sessions
              </h2>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 mb-2">No upcoming sessions scheduled</p>
                  <p className="text-gray-400 text-sm mb-4">When patients book sessions, they'll appear here</p>
                  <Link href="/counselor/sessions" className="inline-block text-sm bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-lg transition-colors">
                    View all sessions
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map((session, index) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                      <div className="mt-3 flex space-x-2">
                        <Link
                          href={`/counselor/sessions/${session.id}`}
                          className="text-xs bg-white border border-green-200 hover:bg-green-50 text-green-700 px-3 py-1.5 rounded-lg transition-colors flex items-center"
                        >
                          <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </Link>
                        {session.video_enabled && (
                          <Link
                            href={session.video_join_url || '#'}
                            className="text-xs bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg transition-colors flex items-center"
                          >
                            <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Join Video
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 text-right">
                <Link href="/counselor/sessions" className="inline-flex items-center text-sm text-green-600 hover:text-green-800 font-medium">
                  View all sessions
                  <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Recent Patient Check-ins
              </h2>
              {recentCheckins.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 mb-2">No recent check-ins available</p>
                  <p className="text-gray-400 text-sm mb-4">Patient check-ins will appear here when submitted</p>
                  <Link href="/counselor/patients" className="inline-block text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                    View all patient check-ins
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCheckins.map((checkin, index) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-800">
                            {checkin.user_profiles?.display_name || 'Unknown Patient'}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(checkin.created_at)}</p>
                        </div>
                        <div className="text-2xl bg-gray-50 h-10 w-10 flex items-center justify-center rounded-full">
                          {getMoodEmoji(checkin.mood)}
                        </div>
                      </div>
                      <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {checkin.notes || 'No notes provided'}
                        </p>
                      </div>
                      <div className="mt-3">
                        <Link
                          href={`/counselor/patients?user_id=${checkin.user_id}`}
                          className="text-xs bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg transition-colors flex items-center inline-flex"
                        >
                          <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          View Patient History
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 text-right">
                <Link href="/counselor/patients" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View all patient check-ins
                  <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
