"use client";
import React, { useState, useEffect } from "react";
import { useUser } from '@/utils/useUser';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function CounselorPatients() {
  const { data: user } = useUser();
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get('user_id');
  
  const [patients, setPatients] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadPatients();
    }
  }, [user]);

  useEffect(() => {
    if (selectedUserId) {
      loadPatientDetails(selectedUserId);
    }
  }, [selectedUserId]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      
      // Get all sessions for this counselor
      const { data: sessions, error: sessionsError } = await supabase
        .from('counseling_sessions')
        .select('patient_id')
        .eq('counselor_id', user.id);
      
      if (sessionsError) throw sessionsError;
      
      // Extract unique patient IDs
      const patientIds = [...new Set(sessions?.map(s => s.patient_id) || [])];
      
      if (patientIds.length === 0) {
        setPatients([]);
        setLoading(false);
        return;
      }
      
      // Get patient profiles
      const { data: patientProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', patientIds);
      
      if (profilesError) throw profilesError;
      
      // Get latest check-in for each patient
      const patientCheckins = await Promise.all(
        patientIds.map(async (patientId) => {
          const { data: latestCheckin, error: checkinError } = await supabase
            .from('mental_health_checkins')
            .select('*')
            .eq('user_id', patientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (checkinError && checkinError.code !== 'PGRST116') {
            console.error(`Error fetching checkin for patient ${patientId}:`, checkinError);
          }
          
          return { patientId, latestCheckin: latestCheckin || null };
        })
      );
      
      // Combine patient profiles with their latest check-in
      const patientsWithCheckins = patientProfiles.map(profile => {
        const patientCheckin = patientCheckins.find(c => c.patientId === profile.id);
        return {
          ...profile,
          latestCheckin: patientCheckin?.latestCheckin || null
        };
      });
      
      setPatients(patientsWithCheckins);
      
      // If there's a selected user ID in the URL, load that patient's details
      if (selectedUserId && !selectedPatient) {
        loadPatientDetails(selectedUserId);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error loading patients:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const loadPatientDetails = async (patientId) => {
    try {
      setLoading(true);
      
      // Get patient profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (profileError) throw profileError;
      
      // Get all check-ins for this patient
      const { data: patientCheckins, error: checkinsError } = await supabase
        .from('mental_health_checkins')
        .select('*')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false });
      
      if (checkinsError) throw checkinsError;
      
      setSelectedPatient(profile);
      setCheckins(patientCheckins || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading patient details:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  const getMoodColor = (mood) => {
    switch (mood?.toLowerCase()) {
      case 'very bad': return 'bg-red-100 text-red-800';
      case 'bad': return 'bg-orange-100 text-orange-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'very good': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Patient Check-ins</h1>
        <p className="text-gray-600 mt-1">View and monitor your patients' mental health check-ins</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {loading && !selectedPatient ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patients...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Patient List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-green-50 border-b border-green-100">
              <h2 className="text-lg font-semibold text-gray-800">Your Patients</h2>
            </div>
            
            {patients.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">You don't have any patients yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {patients.map((patient) => (
                  <div 
                    key={patient.id} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedPatient?.id === patient.id ? 'bg-green-50' : ''}`}
                    onClick={() => loadPatientDetails(patient.id)}
                  >
                    <div className="flex items-start">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-medium mr-3">
                        {patient.display_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{patient.display_name || 'Anonymous'}</h3>
                        <p className="text-sm text-gray-500">
                          {patient.latestCheckin ? (
                            <>Last check-in: {formatDate(patient.latestCheckin.created_at)}</>
                          ) : (
                            <>No check-ins yet</>
                          )}
                        </p>
                      </div>
                      {patient.latestCheckin && (
                        <div className="text-xl" title={patient.latestCheckin.mood || 'Unknown mood'}>
                          {getMoodEmoji(patient.latestCheckin.mood)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Details and Check-ins */}
          <div className="md:col-span-2">
            {selectedPatient ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-medium mr-4">
                      {selectedPatient.display_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">{selectedPatient.display_name || 'Anonymous'}</h2>
                      <p className="text-gray-500">{selectedPatient.email || 'No email provided'}</p>
                    </div>
                  </div>
                  
                  {selectedPatient.bio && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-500">Bio</h3>
                      <p className="mt-1 text-gray-700">{selectedPatient.bio}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Joined</h3>
                      <p className="mt-1 text-gray-700">{formatDate(selectedPatient.created_at)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Check-ins</h3>
                      <p className="mt-1 text-gray-700">{checkins.length}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex space-x-3">
                    <Link 
                      href={`/counselor/sessions?patient_id=${selectedPatient.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                      View Sessions
                    </Link>
                    <button 
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                      onClick={() => {
                        // Handle scheduling a new session
                      }}
                    >
                      Schedule Session
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Check-in History</h3>
                  
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading check-ins...</p>
                    </div>
                  ) : checkins.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No check-ins found for this patient.</p>
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                      {checkins.map((checkin) => (
                        <div key={checkin.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="text-sm text-gray-500">{formatDate(checkin.created_at)}</div>
                              <div className="mt-1 flex items-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMoodColor(checkin.mood)}`}>
                                  {getMoodEmoji(checkin.mood)} {checkin.mood || 'Unknown mood'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {checkin.notes && (
                            <div className="mt-2">
                              <h4 className="text-sm font-medium text-gray-700">Notes:</h4>
                              <p className="mt-1 text-gray-600 whitespace-pre-line">{checkin.notes}</p>
                            </div>
                          )}
                          
                          {checkin.sleep_quality && (
                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Sleep Quality:</span>{' '}
                                <span className="font-medium">{checkin.sleep_quality}</span>
                              </div>
                              {checkin.stress_level && (
                                <div>
                                  <span className="text-gray-500">Stress Level:</span>{' '}
                                  <span className="font-medium">{checkin.stress_level}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a patient</h3>
                <p className="text-gray-500">
                  Choose a patient from the list to view their check-in history.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
