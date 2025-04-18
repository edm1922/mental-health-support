"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CounselorProfilePage() {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isCounselor, setIsCounselor] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0
  });

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    specializations: [],
    yearsExperience: "",
    credentials: "",
    availabilityHours: "",
    preferredContactMethod: "app",
    professionalBio: ""
  });

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/account/signin?redirect=/counselor/profile");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user) {
      checkCounselorStatus();
    }
  }, [user]);

  const checkCounselorStatus = async () => {
    try {
      // Check if the user is a counselor
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (profile?.role !== "counselor") {
        setError("You must be a counselor to access this page");
        setIsCounselor(false);
        return;
      }

      setIsCounselor(true);

      // Ensure counselor fields exist in the database
      await ensureCounselorFields();

      // Fetch the updated profile
      const { data: updatedProfile, error: fetchError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setProfile(updatedProfile);

      // Set form data with available fields
      setFormData({
        displayName: updatedProfile.display_name || "",
        bio: updatedProfile.bio || "",
        specializations: updatedProfile.specializations || [],
        yearsExperience: updatedProfile.years_experience || "",
        credentials: updatedProfile.credentials || "",
        availabilityHours: updatedProfile.availability_hours || "",
        preferredContactMethod: updatedProfile.preferred_contact_method || "app",
        professionalBio: updatedProfile.professional_bio || ""
      });

      // Fetch session statistics
      fetchSessionStats();
    } catch (err) {
      console.error("Error checking counselor status:", err);
      setError("Failed to verify counselor status: " + err.message);
    }
  };

  const ensureCounselorFields = async () => {
    try {
      console.log('Ensuring counselor fields exist in the database');

      // Check if the specializations column exists
      const { data: columnCheck, error: columnError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = 'user_profiles'
              AND column_name = 'specializations'
            );
          `
        });

      // If we can't check using exec_sql, try a different approach
      if (columnError) {
        console.log('Error checking columns with exec_sql, trying direct approach');

        // Try to update the profile with a specializations field
        // If it works, the field exists; if it fails with a specific error, it doesn't
        const testUpdate = await supabase
          .from('user_profiles')
          .update({
            specializations: [],
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        // If no column-not-exists error, assume fields exist or were created
        if (!testUpdate.error || !testUpdate.error.message.includes('column')) {
          console.log('Fields appear to exist or were created successfully');
          return;
        }

        // If we get here, we need to add the fields using a direct SQL approach
        console.log('Adding counselor fields using direct SQL');

        // Try to add the fields one by one to handle any errors gracefully
        const addSpecializations = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}';`
        });

        const addYearsExperience = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;`
        });

        const addCredentials = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS credentials TEXT;`
        });

        const addAvailabilityHours = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS availability_hours TEXT;`
        });

        const addProfessionalBio = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS professional_bio TEXT;`
        });

        console.log('Field addition results:', {
          specializations: !addSpecializations.error,
          yearsExperience: !addYearsExperience.error,
          credentials: !addCredentials.error,
          availabilityHours: !addAvailabilityHours.error,
          professionalBio: !addProfessionalBio.error
        });

        return;
      }

      // If the column check worked and the column doesn't exist, add all the fields
      if (!columnCheck || !columnCheck.exists) {
        console.log('Counselor fields do not exist, adding them');

        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE public.user_profiles
              ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}',
              ADD COLUMN IF NOT EXISTS years_experience INTEGER,
              ADD COLUMN IF NOT EXISTS credentials TEXT,
              ADD COLUMN IF NOT EXISTS availability_hours TEXT,
              ADD COLUMN IF NOT EXISTS professional_bio TEXT;
          `
        });

        if (alterError) {
          console.error('Error adding counselor fields:', alterError);
          throw new Error('Failed to add counselor fields: ' + alterError.message);
        }

        console.log('Counselor fields added successfully');
      } else {
        console.log('Counselor fields already exist');
      }
    } catch (err) {
      console.error('Error ensuring counselor fields:', err);
      // Don't throw the error, just log it and continue
      // This allows the profile to load even if field creation fails
    }
  };

  const fetchSessionStats = async () => {
    try {
      // Get total sessions
      const { data: allSessions, error: allError } = await supabase
        .from("counseling_sessions")
        .select("id, status, scheduled_for")
        .eq("counselor_id", user.id.toString());

      if (allError) throw allError;

      const now = new Date();
      const upcoming = allSessions.filter(
        session => new Date(session.scheduled_for) >= now
      ).length;

      const completed = allSessions.filter(
        session => session.status === "completed"
      ).length;

      setSessionStats({
        total: allSessions.length,
        upcoming,
        completed
      });
    } catch (err) {
      console.error("Error fetching session stats:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          display_name: formData.displayName,
          bio: formData.bio,
          specializations: formData.specializations,
          years_experience: formData.yearsExperience,
          credentials: formData.credentials,
          availability_hours: formData.availabilityHours,
          preferred_contact_method: formData.preferredContactMethod,
          professional_bio: formData.professionalBio,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Refresh profile data
      const { data: updatedProfile, error: fetchError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;

      setProfile(updatedProfile);
      setSuccess(true);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile: " + err.message);
    }
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#357AFF] border-t-transparent"></div>
      </div>
    );
  }

  if (error && !isCounselor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Access Denied</h1>
          <p className="mb-6 text-red-600">{error}</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-600 shadow-md hover:bg-gray-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>

          <Link
            href="/counselor/sessions"
            className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
          >
            View Sessions
          </Link>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-xl md:p-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-800">Counselor Profile</h1>

          {success && (
            <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-700">
              Profile updated successfully!
            </div>
          )}

          {error && isCounselor && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-blue-50 p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Total Sessions</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">{sessionStats.total}</p>
            </div>

            <div className="rounded-xl bg-green-50 p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Upcoming</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">{sessionStats.upcoming}</p>
            </div>

            <div className="rounded-xl bg-purple-50 p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Completed</h3>
              <p className="mt-2 text-3xl font-bold text-purple-600">{sessionStats.completed}</p>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Short Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows="3"
                  value={formData.bio}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="A brief introduction visible to all users"
                ></textarea>
              </div>

              <div>
                <label htmlFor="professionalBio" className="block text-sm font-medium text-gray-700">
                  Professional Bio
                </label>
                <textarea
                  id="professionalBio"
                  name="professionalBio"
                  rows="5"
                  value={formData.professionalBio}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="Detailed professional background and approach to counseling"
                ></textarea>
              </div>

              <div>
                <label htmlFor="credentials" className="block text-sm font-medium text-gray-700">
                  Credentials
                </label>
                <input
                  type="text"
                  id="credentials"
                  name="credentials"
                  value={formData.credentials}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="e.g., Licensed Clinical Social Worker (LCSW)"
                />
              </div>

              <div>
                <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700">
                  Years of Experience
                </label>
                <input
                  type="number"
                  id="yearsExperience"
                  name="yearsExperience"
                  value={formData.yearsExperience}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="specializations" className="block text-sm font-medium text-gray-700">
                  Specializations
                </label>
                <select
                  id="specializations"
                  multiple
                  value={formData.specializations}
                  onChange={(e) => handleArrayChange('specializations', Array.from(e.target.selectedOptions, option => option.value))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="Anxiety">Anxiety</option>
                  <option value="Depression">Depression</option>
                  <option value="Trauma">Trauma</option>
                  <option value="Stress Management">Stress Management</option>
                  <option value="Relationships">Relationships</option>
                  <option value="Self-Esteem">Self-Esteem</option>
                  <option value="Grief">Grief</option>
                  <option value="Life Transitions">Life Transitions</option>
                  <option value="Career Counseling">Career Counseling</option>
                  <option value="Substance Use">Substance Use</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple options</p>
              </div>

              <div>
                <label htmlFor="availabilityHours" className="block text-sm font-medium text-gray-700">
                  Availability Hours
                </label>
                <textarea
                  id="availabilityHours"
                  name="availabilityHours"
                  rows="3"
                  value={formData.availabilityHours}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="e.g., Monday-Friday: 9am-5pm EST, Weekends: Not available"
                ></textarea>
              </div>

              <div>
                <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-gray-700">
                  Preferred Contact Method
                </label>
                <select
                  id="preferredContactMethod"
                  name="preferredContactMethod"
                  value={formData.preferredContactMethod}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="app">In-App Messaging</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Edit Profile
                </button>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h2 className="text-xl font-semibold text-gray-800">{profile?.display_name || user?.email}</h2>
                <p className="mt-2 text-gray-600">{profile?.credentials || "No credentials provided"}</p>
                <p className="mt-1 text-sm text-gray-500">{profile?.years_experience ? `${profile.years_experience} years of experience` : "Experience not specified"}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700">Bio</h3>
                <p className="mt-2 text-gray-600">{profile?.bio || "No bio provided"}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700">Professional Background</h3>
                <p className="mt-2 text-gray-600">{profile?.professional_bio || "No professional bio provided"}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700">Specializations</h3>
                {profile?.specializations && profile.specializations.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.specializations.map((spec, index) => (
                      <span key={index} className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                        {spec}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-gray-600">No specializations listed</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700">Availability</h3>
                <p className="mt-2 text-gray-600">{profile?.availability_hours || "No availability information provided"}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700">Contact Preference</h3>
                <p className="mt-2 text-gray-600">
                  {profile?.preferred_contact_method === "app" ? "In-App Messaging" :
                   profile?.preferred_contact_method === "email" ? "Email" :
                   profile?.preferred_contact_method === "phone" ? "Phone" :
                   "Not specified"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
