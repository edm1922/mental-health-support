"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useUser } from '../../utils/useUser';
import { supabase } from '../../utils/supabaseClient';

export default function CounselorRecruitmentCTA() {
  const { data: user, loading: userLoading } = useUser();
  const [userStatus, setUserStatus] = useState('none'); // 'none', 'counselor', 'pending'

  useEffect(() => {
    async function checkCounselorStatus() {
      if (!user) return;

      try {
        // Check if user is already a counselor
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profileError && profile?.role === "counselor") {
          setUserStatus('counselor');
          return;
        }

        // Check if user has a pending application
        const { data: application, error: applicationError } = await supabase
          .from("counselor_applications")
          .select("status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!applicationError && application) {
          setUserStatus('pending');
        }
      } catch (err) {
        console.error("Error checking counselor status:", err);
      }
    }

    if (user && !userLoading) {
      checkCounselorStatus();
    }
  }, [user, userLoading]);
  return (
    <section className="py-16 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Are You a Mental Health Professional?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of counselors who are making a difference in people's lives through our platform.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-left max-w-md">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center mr-4">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Flexible Income</h3>
              </div>
              <p className="text-blue-100">Set your own rates and schedule. Our platform makes it easy to manage appointments and payments.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-left max-w-md">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center mr-4">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Expand Your Reach</h3>
              </div>
              <p className="text-blue-100">Connect with clients who need your expertise, regardless of geographic limitations.</p>
            </div>
          </div>

          <Link
            href="/apply-as-counselor"
            className="inline-block px-8 py-4 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20 text-lg"
          >
            Apply as a Counselor
          </Link>
          <p className="mt-4 text-blue-200 text-sm">
            Simple application process. You'll need to sign in or create an account to apply.
            After signing in, we'll check if you're eligible to apply.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
