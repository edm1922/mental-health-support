"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GlassContainer,
  GlassCard,
  BackButton,
  ModernButton,
  ModernHeading,
  ModernAlert,
  ModernSpinner
} from "@/components/ui/ModernUI";

export default function CounselorProfilePage({ params }) {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const [counselor, setCounselor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestingSession, setRequestingSession] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchCounselorProfile(params.id);
    }
  }, [params?.id]);

  const fetchCounselorProfile = async (counselorId) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', counselorId)
        .eq('role', 'counselor')
        .single();

      if (error) {
        throw new Error('Failed to fetch counselor profile');
      }

      setCounselor(data);
    } catch (err) {
      console.error('Error fetching counselor profile:', err);
      setError(err.message || 'An error occurred while fetching the counselor profile');
    } finally {
      setLoading(false);
    }
  };

  const requestSession = async () => {
    if (!user || !counselor) return;

    try {
      setRequestingSession(true);
      setError(null);
      setSessionSuccess(false);

      // Get the current date and add 1 day
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + 1);
      scheduledFor.setHours(10, 0, 0, 0); // Set to 10:00 AM

      const response = await fetch('/api/counseling/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          counselorId: counselor.id,
          patientId: user.id,
          type: 'one_on_one',
          scheduledFor: scheduledFor.toISOString(),
          videoEnabled: false,
          notes: 'Session requested from counselor profile'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request session');
      }

      setSessionSuccess(true);

      // Redirect to sessions page after a short delay
      setTimeout(() => {
        router.push('/sessions');
      }, 2000);
    } catch (err) {
      console.error('Error requesting session:', err);
      setError(err.message || 'An error occurred while requesting a session');
    } finally {
      setRequestingSession(false);
    }
  };

  if (loading || userLoading) {
    return (
      <GlassContainer className="flex items-center justify-center">
        <ModernSpinner size="large" />
      </GlassContainer>
    );
  }

  if (!user) {
    return (
      <GlassContainer className="flex flex-col items-center justify-center">
        <GlassCard className="w-full max-w-md text-center">
          <ModernHeading level={1}>Sign In Required</ModernHeading>
          <p className="mb-6 text-gray-600">
            Please sign in to view counselor profiles.
          </p>
          <ModernButton
            onClick={() => window.location.href = "/account/signin"}
          >
            Sign In
          </ModernButton>
        </GlassCard>
      </GlassContainer>
    );
  }

  if (error) {
    return (
      <GlassContainer>
        <BackButton />
        <GlassCard className="text-center">
          <ModernAlert type="error">
            {error}
          </ModernAlert>
          <div className="mt-4">
            <Link href="/find-counselor">
              <ModernButton>
                Back to Counselor Search
              </ModernButton>
            </Link>
          </div>
        </GlassCard>
      </GlassContainer>
    );
  }

  if (!counselor) {
    return (
      <GlassContainer>
        <BackButton />
        <GlassCard className="text-center">
          <ModernHeading level={1}>Counselor Not Found</ModernHeading>
          <p className="mb-6 text-gray-600">
            The counselor you are looking for could not be found.
          </p>
          <Link href="/find-counselor">
            <ModernButton>
              Back to Counselor Search
            </ModernButton>
          </Link>
        </GlassCard>
      </GlassContainer>
    );
  }

  return (
    <GlassContainer>
      <BackButton />
      <GlassCard className="mb-8 backdrop-blur-md">
        <ModernHeading level={1} className="text-center">
          {counselor.display_name || 'Unnamed Counselor'}
        </ModernHeading>

        <div className="mt-6 space-y-6">
          {counselor.bio && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">About</h2>
              <p className="text-gray-600">{counselor.bio}</p>
            </div>
          )}

          {counselor.specializations && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Specializations</h2>
              <div className="flex flex-wrap gap-2">
                {typeof counselor.specializations === 'string'
                  ? counselor.specializations.split(',').map((spec, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        {spec.trim()}
                      </span>
                    ))
                  : Array.isArray(counselor.specializations)
                    ? counselor.specializations.map((spec, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          {typeof spec === 'string' ? spec.trim() : spec}
                        </span>
                      ))
                    : (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          {String(counselor.specializations)}
                        </span>
                      )
                }
              </div>
            </div>
          )}

          {counselor.availability_hours && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Availability</h2>
              <p className="text-gray-600">{counselor.availability_hours}</p>
            </div>
          )}

          {sessionSuccess && (
            <ModernAlert type="success">
              Session request submitted successfully! Redirecting to your sessions...
            </ModernAlert>
          )}

          {error && (
            <ModernAlert type="error">
              {error}
            </ModernAlert>
          )}

          <div className="flex justify-center mt-8">
            <ModernButton
              onClick={requestSession}
              disabled={requestingSession}
              className="px-8"
            >
              {requestingSession ? "Requesting..." : "Request Session"}
            </ModernButton>
          </div>
        </div>
      </GlassCard>
    </GlassContainer>
  );
}
