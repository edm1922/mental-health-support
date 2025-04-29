"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";
import CounselorDashboardCard from "./CounselorDashboardCard";

export default function CounselorSection() {
  const { data: user, loading: userLoading } = useUser();
  const [isCounselor, setIsCounselor] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkCounselorStatus();
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [user, userLoading]);

  const checkCounselorStatus = async () => {
    try {
      // Check if the user is a counselor
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error checking counselor status:", profileError);
        setIsCounselor(false);
        setLoading(false);
        return;
      }

      const userIsCounselor = profile?.role === "counselor";
      setIsCounselor(userIsCounselor);

      if (userIsCounselor) {
        // Get count of active sessions
        const { data, error } = await supabase
          .from("counseling_sessions")
          .select("id", { count: "exact" })
          .eq("counselor_id", user.id)
          .in("status", ["scheduled", "ongoing"]);

        if (!error) {
          setSessionCount(data?.length || 0);
        }
      }
    } catch (err) {
      console.error("Error in counselor section:", err);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything while loading or if not a counselor
  if (loading || !isCounselor) {
    return null;
  }

  return (
    <div className="mb-8">
      <CounselorDashboardCard sessionCount={sessionCount} />
    </div>
  );
}

export function CounselorApplicationSection() {
  const { data: user, loading: userLoading } = useUser();
  const [isCounselor, setIsCounselor] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkStatus();
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [user, userLoading]);

  const checkStatus = async () => {
    try {
      console.log("Checking counselor application status for user:", user?.id);

      // First check directly with Supabase
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      console.log("Direct profile check:", profile, "Error:", profileError);

      if (profile?.role === "counselor") {
        console.log("User is a counselor according to direct check");
        setIsCounselor(true);
        return;
      }

      // Use the API route to check application status
      const response = await fetch("/api/counselor/application-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch application status");
      }

      const data = await response.json();
      console.log("Application status API response:", data);

      if (data.isCounselor || data.status === "approved") {
        console.log("User is a counselor according to API");
        setIsCounselor(true);

        // Force a page reload to ensure all components update
        if (data.status === "approved" && !isCounselor) {
          console.log("Application was just approved, reloading page");
          window.location.reload();
        }

        return;
      }

      if (data.status && data.status !== "not_found") {
        console.log("User has an application with status:", data.status);
        setHasApplied(true);
        setApplicationStatus(data.status);
      }
    } catch (err) {
      console.error("Error checking counselor application status:", err);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything while loading or if already a counselor
  if (loading || isCounselor || !user) {
    return null;
  }

  return (
    <div className="mb-8 rounded-xl bg-indigo-600 p-6 text-white shadow-xl">
      <h2 className="text-2xl font-bold">Are You a Mental Health Professional?</h2>
      <p className="mt-2 opacity-90">
        Join our platform to help more people access quality mental health support.
      </p>

      <div className="mt-6">
        {hasApplied ? (
          <div className="rounded-lg bg-white/20 p-4 backdrop-blur-sm">
            <p className="font-medium">
              {applicationStatus === 'pending' && "Your application is being reviewed. We'll notify you once it's processed."}
              {applicationStatus === 'approved' && (
                <>
                  Your application has been approved! You can now access counselor features.
                  <div className="mt-2">
                    <Link href="/counselor/dashboard" className="inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
                      Go to Counselor Dashboard
                    </Link>
                  </div>
                </>
              )}
              {applicationStatus === 'rejected' && "Your application was not approved. Please contact support for more information."}
              {!applicationStatus && "Your application status is being checked."}
            </p>
            <div className="mt-3 flex justify-end">
              <button
                onClick={checkStatus}
                className="text-sm text-white/80 hover:text-white underline"
              >
                Refresh Status
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/apply/counselor"
            className="inline-block rounded-lg bg-white px-6 py-3 font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Apply to Join as a Counselor
          </Link>
        )}
      </div>
    </div>
  );
}
