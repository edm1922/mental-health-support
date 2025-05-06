"use client";
import React, { useState, useEffect } from "react";
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import RoleBasedActionCards from '../../components/RoleBasedActionCards';
import UserHomeHero from '../../components/user/UserHomeHero';
import UserStats from '../../components/user/UserStats';
import { useUser } from '../../utils/useUser';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import dynamic from 'next/dynamic';
import AssistantIcon from '../../components/AssistantIcon';
import { supabase } from '../../utils/supabaseClient';

// Dynamically import the EmotionAIAssistant component with no SSR
const EmotionAIAssistant = dynamic(
  () => import('../../components/EmotionAIAssistant'),
  { ssr: false }
);

export default function HomePage() {
  const { data: user, loading: userLoading, profile } = useUser();
  const { showError } = useNotification();
  const [pageLoading, setPageLoading] = useState(true);
  const [userStats, setUserStats] = useState({});

  // Check user role and redirect if needed
  useEffect(() => {
    const checkUserRole = async () => {
      if (user && profile) {
        // Check user metadata for role first (more reliable)
        const { data: userData } = await supabase.auth.getUser();
        const metadataRole = userData?.user?.user_metadata?.role;

        // If user has a role in metadata, update their profile to match
        if (metadataRole === 'counselor' || metadataRole === 'admin') {
          try {
            // Update the profile to ensure it matches the metadata
            await supabase
              .from('user_profiles')
              .upsert({
                id: profile.id,
                role: metadataRole,
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' });

            console.log(`Updated profile role from metadata: ${metadataRole}`);

            // Add no_redirect parameter to prevent middleware redirection loops
            const redirectUrl = metadataRole === 'counselor'
              ? '/counselor/dashboard/direct?no_redirect=true'
              : '/admin/dashboard?no_redirect=true';
            console.log(`User is a ${metadataRole} (from metadata), redirecting to ${redirectUrl}`);
            window.location.href = redirectUrl;
            return;
          } catch (updateError) {
            console.error('Error updating role in profile from metadata:', updateError);
          }
        }

        // If user is a counselor or admin based on profile, redirect to the appropriate dashboard
        if (profile.role === 'counselor' || profile.role === 'admin') {
          // Add no_redirect parameter to prevent middleware redirection loops
          const redirectUrl = profile.role === 'counselor'
            ? '/counselor/dashboard/direct?no_redirect=true'
            : '/admin/dashboard?no_redirect=true';
          console.log(`User is a ${profile.role}, redirecting to ${redirectUrl}`);
          window.location.href = redirectUrl;
          return;
        }
      }
    };

    checkUserRole();
  }, [user, profile]);

  // Fetch user stats
  useEffect(() => {
    async function fetchUserStats() {
      if (!user) return;

      try {
        // Get check-in stats
        const { data: streakData, error: streakError } = await supabase
          .from('user_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', user.id)
          .single();

        if (streakError && streakError.code !== 'PGRST116') {
          console.error('Error fetching streak data:', streakError);
        }

        // Get total check-ins and last check-in date
        const { data: checkinsData, error: checkinsError } = await supabase
          .from('mental_health_checkins')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (checkinsError) {
          console.error('Error fetching check-ins:', checkinsError);
        }

        // Get sessions count
        const { count: sessionsCount, error: sessionsError } = await supabase
          .from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (sessionsError) {
          console.error('Error fetching sessions count:', sessionsError);
        }

        // Get community posts count
        const { count: postsCount, error: postsError } = await supabase
          .from('forum_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (postsError) {
          console.error('Error fetching posts count:', postsError);
        }

        // Combine all stats
        setUserStats({
          currentStreak: streakData?.current_streak || 0,
          longestStreak: streakData?.longest_streak || 0,
          totalCheckins: checkinsData?.length || 0,
          lastCheckin: checkinsData?.[0]?.created_at || null,
          sessionsCompleted: sessionsCount || 0,
          communityPosts: postsCount || 0
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
        showError('Failed to load your activity data');
      }
    }

    if (user && !userLoading) {
      fetchUserStats();
    }

    // End loading state after a minimum time
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, userLoading, showError]);



  if (pageLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="large" color="primary" text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Navbar */}
      <Navbar />

      {/* Personalized Hero Section */}
      <UserHomeHero
        userName={profile?.display_name || user?.email?.split('@')[0]}
        userRole={profile?.role || 'user'}
      />

      <div className="mx-auto max-w-7xl px-6 sm:px-8 py-8">
        {/* User Stats */}
        <UserStats stats={userStats} />

        {/* Role-based action cards */}
        <RoleBasedActionCards userRole={profile?.role || 'user'} />


      </div>

      {/* Footer */}
      <Footer />

      {/* Emotion AI Assistant - shown for all users */}
      {user && (
        <EmotionAIAssistant />
      )}

      {/* Assistant Icon with Quote Bubble */}
      <AssistantIcon />
    </div>
  );
}
