"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';
import CounselorNavbar from '@/components/ui/CounselorNavbar';

export default function DirectCounselorDashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);

  // Function to set up necessary tables and sample data
  const setupTables = async () => {
    try {
      const response = await fetch('/api/setup-counselor-tables');
      const data = await response.json();
      console.log('Setup tables response:', data);
      return data.success;
    } catch (err) {
      console.error('Error setting up tables:', err);
      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // First, try to set up the necessary tables and sample data
        await setupTables();

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }

        if (!session) {
          throw new Error('No session found. Please sign in.');
        }

        // Use the existing session
        setUser({
          id: session.user.id,
          email: session.user.email
        });

        // Get the user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else {
          setProfile(profileData);
        }

        // Fetch real sessions
        try {
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('counseling_sessions')
            .select(`
              id,
              session_date,
              status,
              client_id,
              client_profiles:client_id (
                id,
                display_name
              )
            `)
            .eq('counselor_id', session.user.id)
            .order('session_date', { ascending: false })
            .limit(10);

          if (sessionsError) {
            console.error('Error fetching sessions:', sessionsError);
            // Use sample data if there's an error
            setSessions([
              { id: 1, client_name: 'John Doe', date: '2023-06-15', status: 'completed' },
              { id: 2, client_name: 'Jane Smith', date: '2023-06-20', status: 'upcoming' },
              { id: 3, client_name: 'Bob Johnson', date: '2023-06-25', status: 'upcoming' }
            ]);
          } else if (!sessionsData || sessionsData.length === 0) {
            // Use sample data if no sessions found
            setSessions([
              { id: 1, client_name: 'John Doe', date: '2023-06-15', status: 'completed' },
              { id: 2, client_name: 'Jane Smith', date: '2023-06-20', status: 'upcoming' },
              { id: 3, client_name: 'Bob Johnson', date: '2023-06-25', status: 'upcoming' }
            ]);
          } else {
            // Format sessions data
            const formattedSessions = sessionsData.map(s => ({
              id: s.id,
              client_name: s.client_profiles?.display_name || 'Unknown Client',
              date: s.session_date,
              status: s.status
            }));

            setSessions(formattedSessions);
          }
        } catch (err) {
          console.error('Exception fetching sessions:', err);
          // Use sample data if there's an exception
          setSessions([
            { id: 1, client_name: 'John Doe', date: '2023-06-15', status: 'completed' },
            { id: 2, client_name: 'Jane Smith', date: '2023-06-20', status: 'upcoming' },
            { id: 3, client_name: 'Bob Johnson', date: '2023-06-25', status: 'upcoming' }
          ]);
        }

        // Fetch real check-ins
        try {
          const { data: checkInsData, error: checkInsError } = await supabase
            .from('daily_check_ins')
            .select(`
              id,
              created_at,
              mood_rating,
              notes,
              user_id,
              user_profiles:user_id (
                id,
                display_name
              )
            `)
            .order('created_at', { ascending: false })
            .limit(5);

          if (checkInsError) {
            console.error('Error fetching check-ins:', checkInsError);
            // Use sample data if there's an error
            setCheckIns([
              {
                id: 1,
                created_at: new Date().toISOString(),
                mood_rating: 3,
                notes: 'Feeling stressed about work deadlines.',
                user_id: '1',
                user_profiles: { display_name: 'John Doe' }
              },
              {
                id: 2,
                created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                mood_rating: 7,
                notes: 'Had a good day, practiced meditation.',
                user_id: '2',
                user_profiles: { display_name: 'Jane Smith' }
              }
            ]);
          } else if (!checkInsData || checkInsData.length === 0) {
            // Use sample data if no check-ins found
            setCheckIns([
              {
                id: 1,
                created_at: new Date().toISOString(),
                mood_rating: 3,
                notes: 'Feeling stressed about work deadlines.',
                user_id: '1',
                user_profiles: { display_name: 'John Doe' }
              },
              {
                id: 2,
                created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                mood_rating: 7,
                notes: 'Had a good day, practiced meditation.',
                user_id: '2',
                user_profiles: { display_name: 'Jane Smith' }
              }
            ]);
          } else {
            setCheckIns(checkInsData);
          }
        } catch (err) {
          console.error('Exception fetching check-ins:', err);
          // Use sample data if there's an exception
          setCheckIns([
            {
              id: 1,
              created_at: new Date().toISOString(),
              mood_rating: 3,
              notes: 'Feeling stressed about work deadlines.',
              user_id: '1',
              user_profiles: { display_name: 'John Doe' }
            },
            {
              id: 2,
              created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
              mood_rating: 7,
              notes: 'Had a good day, practiced meditation.',
              user_id: '2',
              user_profiles: { display_name: 'Jane Smith' }
            }
          ]);
        }

        // Fetch real community posts
        try {
          const { data: postsData, error: postsError } = await supabase
            .from('community_posts')
            .select(`
              id,
              title,
              created_at,
              user_id,
              reply_count,
              user_profiles:user_id (
                id,
                display_name
              )
            `)
            .order('created_at', { ascending: false })
            .limit(5);

          if (postsError) {
            console.error('Error fetching community posts:', postsError);
            // Use sample data if there's an error
            setCommunityPosts([
              {
                id: 1,
                title: 'Tips for managing anxiety during exams',
                created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                user_id: '3',
                reply_count: 5,
                user_profiles: { display_name: 'New Discussion' }
              },
              {
                id: 2,
                title: 'Mindfulness techniques for beginners',
                created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                user_id: session.user.id, // Current user's post
                reply_count: 12,
                user_profiles: { display_name: 'Your Post' }
              }
            ]);
          } else if (!postsData || postsData.length === 0) {
            // Use sample data if no posts found
            setCommunityPosts([
              {
                id: 1,
                title: 'Tips for managing anxiety during exams',
                created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                user_id: '3',
                reply_count: 5,
                user_profiles: { display_name: 'New Discussion' }
              },
              {
                id: 2,
                title: 'Mindfulness techniques for beginners',
                created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                user_id: session.user.id, // Current user's post
                reply_count: 12,
                user_profiles: { display_name: 'Your Post' }
              }
            ]);
          } else {
            setCommunityPosts(postsData);
          }
        } catch (err) {
          console.error('Exception fetching community posts:', err);
          // Use sample data if there's an exception
          setCommunityPosts([
            {
              id: 1,
              title: 'Tips for managing anxiety during exams',
              created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
              user_id: '3',
              reply_count: 5,
              user_profiles: { display_name: 'New Discussion' }
            },
            {
              id: 2,
              title: 'Mindfulness techniques for beginners',
              created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
              user_id: session.user.id, // Current user's post
              reply_count: 12,
              user_profiles: { display_name: 'Your Post' }
            }
          ]);
        }

      } catch (err) {
        setError(err.message);
        console.error('Error in fetchData:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <Link href="/direct-counselor" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Try Direct Access
            </Link>
            <Link href="/" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <CounselorNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Welcome to the Counselor Portal</h2>
          <p className="text-gray-600 mb-4">
            As a counselor, you have access to tools that help you support your clients' mental health journey.
            Monitor daily check-ins, manage sessions, and participate in the community forum.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <h3 className="font-medium text-green-800">Manage Sessions</h3>
              </div>
              <p className="text-sm text-green-700">Schedule and track therapy sessions with your clients.</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <h3 className="font-medium text-blue-800">Monitor Check-ins</h3>
              </div>
              <p className="text-sm text-blue-700">Review daily mood and activity logs from your clients.</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                <h3 className="font-medium text-purple-800">Community Support</h3>
              </div>
              <p className="text-sm text-purple-700">Participate in discussions and provide expert guidance.</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Sessions</h2>

          {sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.client_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(() => {
                          try {
                            return new Date(session.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            });
                          } catch (err) {
                            console.error('Date parsing error:', err);
                            return session.date; // Return the raw date if parsing fails
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === 'completed' ? 'bg-green-100 text-green-800' :
                          session.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link href={`/counselor/sessions/${session.id}`} className="text-blue-600 hover:text-blue-900">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No sessions found. You can create new sessions from the Sessions page.</p>
          )}

          <div className="mt-4 text-right">
            <Link href="/counselor/sessions" className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              View all sessions →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Client Check-ins</h2>

            {checkIns.length > 0 ? (
              <div className="space-y-4">
                {checkIns.map(checkIn => {
                  // Determine border color based on mood rating
                  let borderColor = 'border-gray-400';
                  if (checkIn.mood_rating <= 3) {
                    borderColor = 'border-red-400';
                  } else if (checkIn.mood_rating <= 5) {
                    borderColor = 'border-yellow-400';
                  } else if (checkIn.mood_rating <= 7) {
                    borderColor = 'border-blue-400';
                  } else {
                    borderColor = 'border-green-400';
                  }

                  // Get emoji based on mood rating
                  const emojis = ['😭', '😢', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '😍'];
                  const emoji = emojis[Math.min(Math.max(Math.floor(checkIn.mood_rating), 0), 9)];

                  // Format date
                  const checkInDate = new Date(checkIn.created_at);
                  const now = new Date();
                  const yesterday = new Date(now);
                  yesterday.setDate(yesterday.getDate() - 1);

                  let dateDisplay = '';
                  if (checkInDate.toDateString() === now.toDateString()) {
                    dateDisplay = 'Today';
                  } else if (checkInDate.toDateString() === yesterday.toDateString()) {
                    dateDisplay = 'Yesterday';
                  } else {
                    dateDisplay = checkInDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    });
                  }

                  return (
                    <div key={checkIn.id} className={`border-l-4 ${borderColor} pl-4 py-2`}>
                      <div className="flex justify-between">
                        <p className="font-medium">{checkIn.user_profiles?.display_name || 'Unknown User'}</p>
                        <span className="text-sm text-gray-500">{dateDisplay}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-2xl mr-2">{emoji}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          checkIn.mood_rating <= 3 ? 'bg-red-100 text-red-800' :
                          checkIn.mood_rating <= 5 ? 'bg-yellow-100 text-yellow-800' :
                          checkIn.mood_rating <= 7 ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          Mood: {checkIn.mood_rating}/9
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{checkIn.notes || 'No notes provided'}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No recent check-ins found.</p>
            )}

            <div className="mt-4 text-right">
              <Link href="/counselor/check-ins" className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                View all check-ins →
              </Link>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Community Activity</h2>

            {communityPosts.length > 0 ? (
              <div className="space-y-4">
                {communityPosts.map(post => {
                  // Format date
                  const postDate = new Date(post.created_at);
                  const now = new Date();
                  const yesterday = new Date(now);
                  yesterday.setDate(yesterday.getDate() - 1);

                  let timeAgo = '';
                  const diffMs = now - postDate;
                  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

                  if (diffHrs < 1) {
                    timeAgo = 'Just now';
                  } else if (diffHrs < 24) {
                    timeAgo = `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
                  } else if (postDate.toDateString() === yesterday.toDateString()) {
                    timeAgo = 'Yesterday';
                  } else {
                    timeAgo = postDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    });
                  }

                  // Determine if this is the user's own post
                  const isOwnPost = post.user_id === user?.id;
                  const borderColor = isOwnPost ? 'border-purple-400' : 'border-blue-400';

                  return (
                    <div key={post.id} className={`border-l-4 ${borderColor} pl-4 py-2`}>
                      <div className="flex justify-between">
                        <p className="font-medium">{isOwnPost ? 'Your Post' : post.user_profiles?.display_name || 'Unknown User'}</p>
                        <span className="text-sm text-gray-500">{timeAgo}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        "{post.title}" - {post.reply_count || 0} {post.reply_count === 1 ? 'reply' : 'replies'}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No recent community activity found.</p>
            )}

            <div className="mt-4 text-right">
              <Link href="/community" className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                Visit community forum →
              </Link>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Link href="/counselor/sessions" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Manage Sessions
          </Link>
          <Link href="/counselor/check-ins" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            View Check-ins
          </Link>
          <Link href="/community" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Community Forum
          </Link>
        </div>
      </main>
    </div>
  );
}
