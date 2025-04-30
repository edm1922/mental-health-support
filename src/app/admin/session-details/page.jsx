"use client";
import React, { useState, useEffect } from "react";
import { useUser } from '@/utils/useUser';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function SessionDetailsPage() {
  const { data: user } = useUser();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');
  
  const [sessionDetails, setSessionDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [counselor, setCounselor] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      if (sessionId) {
        loadSessionDetails();
      }
    }
  }, [user, sessionId]);

  const checkAdminStatus = async () => {
    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setIsAdmin(profile?.role === "admin");
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError("Failed to verify admin status");
    }
  };

  const loadSessionDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('counseling_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSessionDetails(session);

      // Get counselor details
      if (session.counselor_id) {
        const { data: counselorData, error: counselorError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.counselor_id)
          .single();

        if (counselorError) throw counselorError;
        setCounselor(counselorData);
      }

      // Get patient details
      if (session.patient_id) {
        const { data: patientData, error: patientError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.patient_id)
          .single();

        if (patientError) throw patientError;
        setPatient(patientData);
      }

      // Get session messages
      const { data: sessionMessages, error: messagesError } = await supabase
        .from('session_messages')
        .select('*, user_profiles(display_name)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(sessionMessages || []);

    } catch (err) {
      console.error("Error loading session details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-700 mb-6">
              You don't have permission to access this page. This area is restricted to administrators only.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Session Details</h1>
          <div className="flex space-x-4">
            <Link
              href="/admin/users"
              className="bg-white text-gray-600 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Users
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600 border border-red-200">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : sessionDetails ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Counseling Session</h2>
                  <p className="text-blue-100">ID: {sessionDetails.id}</p>
                  <div className="mt-2">
                    <span className={`px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium ${
                      sessionDetails.status === 'completed' ? 'bg-green-500 bg-opacity-20' :
                      sessionDetails.status === 'scheduled' ? 'bg-blue-500 bg-opacity-20' :
                      'bg-yellow-500 bg-opacity-20'
                    }`}>
                      {sessionDetails.status || 'pending'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Created</p>
                  <p className="font-medium">{formatDate(sessionDetails.created_at)}</p>
                  {sessionDetails.scheduled_time && (
                    <>
                      <p className="text-sm text-blue-100 mt-2">Scheduled</p>
                      <p className="font-medium">{formatDate(sessionDetails.scheduled_time)}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Counselor</h3>
                  {counselor ? (
                    <div>
                      <div className="flex items-center mb-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-3">
                          {counselor.display_name ? counselor.display_name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <p className="font-medium">{counselor.display_name || 'Unnamed Counselor'}</p>
                          <p className="text-sm text-gray-500">{counselor.email || 'No email'}</p>
                        </div>
                      </div>
                      <Link
                        href={`/admin/user-details?id=${counselor.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <span>View Counselor Profile</span>
                        <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  ) : (
                    <p className="text-gray-500">Counselor information not available</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Patient</h3>
                  {patient ? (
                    <div>
                      <div className="flex items-center mb-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold mr-3">
                          {patient.display_name ? patient.display_name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <p className="font-medium">{patient.display_name || 'Unnamed Patient'}</p>
                          <p className="text-sm text-gray-500">{patient.email || 'No email'}</p>
                        </div>
                      </div>
                      <Link
                        href={`/admin/user-details?id=${patient.id}`}
                        className="text-sm text-green-600 hover:text-green-800 flex items-center"
                      >
                        <span>View Patient Profile</span>
                        <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  ) : (
                    <p className="text-gray-500">Patient information not available</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Session Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="mt-1">{sessionDetails.duration || 'N/A'} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="mt-1 capitalize">{sessionDetails.type || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Video Enabled</p>
                    <p className="mt-1">{sessionDetails.video_enabled ? 'Yes' : 'No'}</p>
                  </div>
                  {sessionDetails.video_enabled && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Video Room ID</p>
                        <p className="mt-1">{sessionDetails.video_room_id || 'N/A'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Video Join URL</p>
                        <p className="mt-1 text-xs break-all">{sessionDetails.video_join_url || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Session Messages</h3>
                {messages.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p className="text-gray-500">No messages in this session</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.sender_id === sessionDetails.counselor_id ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                            message.sender_id === sessionDetails.counselor_id 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-xs font-medium">
                                {message.sender_id === sessionDetails.counselor_id 
                                  ? (counselor?.display_name || 'Counselor') 
                                  : (patient?.display_name || 'Patient')}
                              </p>
                              <p className="text-xs opacity-70">{new Date(message.created_at).toLocaleTimeString()}</p>
                            </div>
                            <p>{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-700">Session not found or ID not provided.</p>
            <Link
              href="/admin/users"
              className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Users
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
