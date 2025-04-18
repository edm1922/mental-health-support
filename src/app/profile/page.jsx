"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

// Function to format the last active timestamp in a user-friendly way
function formatLastActive(timestamp) {
  const lastActive = new Date(timestamp);
  const now = new Date();

  // Calculate the difference in milliseconds
  const diffMs = now - lastActive;

  // Convert to seconds, minutes, hours, days
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  // Format based on how long ago
  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHrs < 24) {
    return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    // For older dates, show the actual date
    return lastActive.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

function MainComponent() {
  const router = useRouter();
  const { data: user, loading } = useUser();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    mentalHealthInterests: [],
    supportPreferences: [],
    comfortLevelSharing: "moderate",
    preferredContactMethod: "app",
    emergencyContact: "",
    goals: "",
    preferredResources: [],
    triggers: [],
    copingStrategies: []
  });

  // Function to ensure a profile exists
  const ensureProfileExists = async () => {
    try {
      setError(null);
      console.log('Ensuring profile exists, user:', user);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('No access token available');
        setError('Authentication error - Please sign in again');
        return false;
      }

      const response = await fetch("/api/create-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error creating profile:", data);
        setError(data.error || "Failed to create profile");
        return false;
      }

      console.log('Profile creation response:', data);
      return true;
    } catch (err) {
      console.error("Error ensuring profile exists:", err);
      setError("Failed to create profile: " + (err.message || "Unknown error"));
      return false;
    }
  };

  // Function to load profile data
  const loadProfile = async () => {
    try {
      setError(null);
      console.log('Loading profile, user:', user);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('No access token available');
        setError('Authentication error - Please sign in again');
        return false;
      }

      const response = await fetch("/api/get-basic-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error response:", data);
        setError(data.error || "Failed to load profile");
        return false;
      }

      console.log('Profile data received:', data);
      // Log the exact structure to see if mental health fields exist
      console.log('Profile data keys:', Object.keys(data));
      console.log('Mental health interests:', Array.isArray(data.mental_health_interests) ? data.mental_health_interests : []);
      console.log('Support preferences:', Array.isArray(data.support_preferences) ? data.support_preferences : []);
      console.log('Comfort level sharing:', data.comfort_level_sharing);

      // Ensure array fields are properly handled
      if (data.mental_health_interests && !Array.isArray(data.mental_health_interests)) {
        data.mental_health_interests = [];
      }
      if (data.support_preferences && !Array.isArray(data.support_preferences)) {
        data.support_preferences = [];
      }
      if (data.preferred_resources && !Array.isArray(data.preferred_resources)) {
        data.preferred_resources = [];
      }
      if (data.triggers && !Array.isArray(data.triggers)) {
        data.triggers = [];
      }
      if (data.coping_strategies && !Array.isArray(data.coping_strategies)) {
        data.coping_strategies = [];
      }
      console.log('Last active value:', data.last_active);

      setProfile(data);

      // Set form data with available fields based on user role
      if (data.role === "admin") {
        setFormData({
          displayName: data.display_name || "",
          bio: data.bio || ""
        });
      } else if (data.role === "counselor") {
        setFormData({
          displayName: data.display_name || "",
          bio: data.bio || "",
          preferredContactMethod: data.preferred_contact_method || "app",
          // Counselor-specific fields
          credentials: data.credentials || "",
          yearsExperience: data.years_experience || "",
          specializations: data.specializations || [],
          availabilityHours: data.availability_hours || "",
          professionalBio: data.professional_bio || ""
        });
      } else {
        setFormData({
          displayName: data.display_name || "",
          bio: data.bio || "",
          mentalHealthInterests: data.mental_health_interests || [],
          supportPreferences: data.support_preferences || [],
          comfortLevelSharing: data.comfort_level_sharing || "moderate",
          preferredContactMethod: data.preferred_contact_method || "app",
          emergencyContact: data.emergency_contact || "",
          goals: data.goals || "",
          preferredResources: data.preferred_resources || [],
          triggers: data.triggers || [],
          copingStrategies: data.coping_strategies || []
        });
      }

      return true;
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile: " + (err.message || "Unknown error"));
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      const initProfile = async () => {
        // First ensure a profile exists
        const profileCreated = await ensureProfileExists();
        // Then load the profile
        if (profileCreated) {
          await loadProfile();
        }
      };

      initProfile();
    } else if (!loading) {
      setError("Please sign in to view your profile");
    }
  }, [user, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('No access token available');
        setError('Authentication error - Please sign in again');
        return;
      }

      // Prepare the request body based on user role
      const requestBody = profile?.role === "admin" ? {
        displayName: formData.displayName,
        bio: formData.bio,
        preferredContactMethod: formData.preferredContactMethod
      } : profile?.role === "counselor" ? {
        displayName: formData.displayName,
        bio: formData.bio,
        preferredContactMethod: formData.preferredContactMethod,
        // Counselor-specific fields
        credentials: formData.credentials,
        yearsExperience: formData.yearsExperience,
        specializations: formData.specializations,
        availabilityHours: formData.availabilityHours,
        professionalBio: formData.professionalBio
      } : {
        displayName: formData.displayName,
        bio: formData.bio,
        mentalHealthInterests: formData.mentalHealthInterests,
        supportPreferences: formData.supportPreferences,
        comfortLevelSharing: formData.comfortLevelSharing,
        preferredContactMethod: formData.preferredContactMethod,
        emergencyContact: formData.emergencyContact,
        goals: formData.goals,
        preferredResources: formData.preferredResources,
        triggers: formData.triggers,
        copingStrategies: formData.copingStrategies
      };

      const response = await fetch("/api/simple-update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      let data;
      try {
        data = await response.json();
        console.log('Profile update response:', response.status, data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        setError('Failed to parse server response');
        return;
      }

      if (response.ok) {
        console.log('Setting profile with data:', data.profile);

        if (data.profile) {
          console.log('Profile data received after update:', data.profile);
          setProfile(data.profile);

          // Update form data with the returned profile based on user role
          if (data.profile.role === "admin") {
            setFormData({
              displayName: data.profile.display_name || "",
              bio: data.profile.bio || "",
              preferredContactMethod: data.profile.preferred_contact_method || "app"
            });
          } else if (data.profile.role === "counselor") {
            setFormData({
              displayName: data.profile.display_name || "",
              bio: data.profile.bio || "",
              preferredContactMethod: data.profile.preferred_contact_method || "app",
              // Counselor-specific fields
              credentials: data.profile.credentials || "",
              yearsExperience: data.profile.years_experience || "",
              specializations: data.profile.specializations || [],
              availabilityHours: data.profile.availability_hours || "",
              professionalBio: data.profile.professional_bio || ""
            });
          } else {
            setFormData({
              displayName: data.profile.display_name || "",
              bio: data.profile.bio || "",
              mentalHealthInterests: data.profile.mental_health_interests || [],
              supportPreferences: data.profile.support_preferences || [],
              comfortLevelSharing: data.profile.comfort_level_sharing || "moderate",
              preferredContactMethod: data.profile.preferred_contact_method || "app",
              emergencyContact: data.profile.emergency_contact || "",
              goals: data.profile.goals || "",
              preferredResources: data.profile.preferred_resources || [],
              triggers: data.profile.triggers || [],
              copingStrategies: data.profile.coping_strategies || []
            });
          }

          setSuccess(true);
          setIsEditing(false);

          // Force a reload of the profile data after a short delay
          setTimeout(() => {
            loadProfile();
          }, 500);
        } else {
          console.warn('Profile update succeeded but no profile data returned');
          // Reload the profile to ensure we have the latest data
          const success = await loadProfile();

          if (success) {
            setSuccess(true);
            setIsEditing(false);
          } else {
            setError("Profile was updated but couldn't load the latest data");
          }
        }
      } else {
        console.error('Profile update failed with status:', response.status);
        let errorMessage = data.error || "Failed to update profile";
        if (data.details) {
          errorMessage += `: ${data.details}`;
        }

        // If we get a row-level security error, try to create the profile first
        if (errorMessage.includes('row-level security policy')) {
          console.log('Detected RLS error, trying to create profile first');
          const profileCreated = await ensureProfileExists();

          if (profileCreated) {
            // Try the update again
            console.log('Profile created, retrying update');
            await handleSubmit(e);
            return;
          }
        }

        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile: " + (err.message || 'Unknown error'));

      // Try to get more information about the error
      if (err.response) {
        try {
          const errorData = await err.response.json();
          console.error('Error response data:', errorData);
          setError(errorData.error || "Failed to update profile");
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle array fields separately
    if (['mentalHealthInterests', 'supportPreferences', 'preferredResources', 'triggers', 'copingStrategies'].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value.split(',').map(item => item.trim()).filter(Boolean)
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleArrayInput = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value.split(",").map((item) => item.trim()),
    }));
  };

  const handleGoBack = () => {
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-lg text-gray-600">
            Please{" "}
            <a
              href="/account/signin"
              className="text-indigo-600 hover:text-indigo-500"
            >
              sign in
            </a>{" "}
            to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <a href="/" className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Return to Home
          </a>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Profile Settings
              </h1>
              {profile?.role && (
                <p className="mt-1 text-sm text-gray-500">
                  Current Role:{" "}
                  <span className="font-medium capitalize">{profile.role}</span>
                  {profile.role === "admin" && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Admin Access
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              {!isEditing && (
                <button
                  onClick={() => loadProfile()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              )}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border-l-4 border-green-400">
              <p className="text-green-700">Profile updated successfully!</p>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
              <div className="px-4 py-5 space-y-6 sm:px-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-1">
                  <div>
                    <label
                      htmlFor="displayName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      id="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      id="bio"
                      rows="3"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  {profile?.role === "admin" ? (
                    <>
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Profile</h3>
                      </div>
                    </>
                  ) : profile?.role === "counselor" ? (
                    <>
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Counselor Profile</h3>
                      </div>

                      <div>
                        <label
                          htmlFor="credentials"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Credentials
                        </label>
                        <input
                          type="text"
                          name="credentials"
                          id="credentials"
                          value={formData.credentials || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="e.g., Licensed Clinical Social Worker (LCSW)"
                        />
                        <p className="mt-1 text-xs text-gray-500">Your professional qualifications and certifications</p>
                      </div>

                      <div>
                        <label
                          htmlFor="yearsExperience"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          name="yearsExperience"
                          id="yearsExperience"
                          value={formData.yearsExperience || ''}
                          onChange={handleInputChange}
                          min="0"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="specializations"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Specializations (comma separated)
                        </label>
                        <input
                          type="text"
                          name="specializations"
                          id="specializations"
                          value={Array.isArray(formData.specializations) ? formData.specializations.join(', ') : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData({
                              ...formData,
                              specializations: value.split(',').map(item => item.trim()).filter(Boolean)
                            });
                          }}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="anxiety, depression, trauma, relationships"
                        />
                        <p className="mt-1 text-xs text-gray-500">Areas of expertise you specialize in</p>
                      </div>

                      <div>
                        <label
                          htmlFor="availabilityHours"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Availability Hours
                        </label>
                        <textarea
                          name="availabilityHours"
                          id="availabilityHours"
                          rows="3"
                          value={formData.availabilityHours || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="e.g., Monday-Friday: 9am-5pm EST, Weekends: Not available"
                        ></textarea>
                        <p className="mt-1 text-xs text-gray-500">When you're available for counseling sessions</p>
                      </div>

                      <div>
                        <label
                          htmlFor="professionalBio"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Professional Bio
                        </label>
                        <textarea
                          name="professionalBio"
                          id="professionalBio"
                          rows="5"
                          value={formData.professionalBio || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Detailed professional background and approach to counseling"
                        ></textarea>
                        <p className="mt-1 text-xs text-gray-500">Your professional background and counseling approach</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Mental Health Profile</h3>
                      </div>

                      <div>
                        <label
                          htmlFor="mentalHealthInterests"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Mental Health Interests (comma separated)
                        </label>
                        <input
                          type="text"
                          name="mentalHealthInterests"
                          id="mentalHealthInterests"
                          value={Array.isArray(formData.mentalHealthInterests) ? formData.mentalHealthInterests.join(', ') : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData({
                              ...formData,
                              mentalHealthInterests: value.split(',').map(item => item.trim()).filter(Boolean)
                            });
                          }}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="anxiety, depression, mindfulness"
                        />
                        <p className="mt-1 text-xs text-gray-500">Topics you're interested in learning about or discussing</p>
                      </div>
                    </>
                  )}

                  <div>
                    <label
                      htmlFor="supportPreferences"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Support Preferences (comma separated)
                    </label>
                    <input
                      type="text"
                      name="supportPreferences"
                      id="supportPreferences"
                      value={Array.isArray(formData.supportPreferences) ? formData.supportPreferences.join(', ') : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          supportPreferences: value.split(',').map(item => item.trim()).filter(Boolean)
                        });
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="one-on-one, group sessions, self-guided"
                    />
                    <p className="mt-1 text-xs text-gray-500">How you prefer to receive support</p>
                  </div>

                  <div>
                    <label
                      htmlFor="comfortLevelSharing"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Comfort Level with Sharing
                    </label>
                    <select
                      name="comfortLevelSharing"
                      id="comfortLevelSharing"
                      value={formData.comfortLevelSharing}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="private">Private - Prefer minimal sharing</option>
                      <option value="moderate">Moderate - Comfortable with some sharing</option>
                      <option value="open">Open - Comfortable sharing most experiences</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="preferredContactMethod"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Preferred Contact Method
                    </label>
                    <select
                      name="preferredContactMethod"
                      id="preferredContactMethod"
                      value={formData.preferredContactMethod}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="app">In-App Messaging</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="video">Video Call</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="emergencyContact"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Emergency Contact (optional)
                    </label>
                    <input
                      type="text"
                      name="emergencyContact"
                      id="emergencyContact"
                      value={formData.emergencyContact || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Name: Contact info"
                    />
                    <p className="mt-1 text-xs text-gray-500">Only used in emergency situations</p>
                  </div>

                  <div>
                    <label
                      htmlFor="goals"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Mental Health Goals
                    </label>
                    <textarea
                      name="goals"
                      id="goals"
                      rows="3"
                      value={formData.goals || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="What you hope to achieve through mental health support"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="preferredResources"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Preferred Resources (comma separated)
                    </label>
                    <input
                      type="text"
                      name="preferredResources"
                      id="preferredResources"
                      value={Array.isArray(formData.preferredResources) ? formData.preferredResources.join(', ') : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          preferredResources: value.split(',').map(item => item.trim()).filter(Boolean)
                        });
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="articles, videos, exercises, community"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="triggers"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Triggers (comma separated, optional)
                    </label>
                    <input
                      type="text"
                      name="triggers"
                      id="triggers"
                      value={Array.isArray(formData.triggers) ? formData.triggers.join(', ') : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          triggers: value.split(',').map(item => item.trim()).filter(Boolean)
                        });
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Topics or situations that may be difficult for you"
                    />
                    <p className="mt-1 text-xs text-gray-500">This helps counselors provide appropriate support</p>
                  </div>

                  <div>
                    <label
                      htmlFor="copingStrategies"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Coping Strategies (comma separated)
                    </label>
                    <input
                      type="text"
                      name="copingStrategies"
                      id="copingStrategies"
                      value={Array.isArray(formData.copingStrategies) ? formData.copingStrategies.join(', ') : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          copingStrategies: value.split(',').map(item => item.trim()).filter(Boolean)
                        });
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="meditation, journaling, exercise"
                    />
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-1">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Display Name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile?.display_name || "Not set"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Bio</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile?.bio || "Not set"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Last Active
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile?.last_active
                      ? formatLastActive(profile.last_active)
                      : profile?.updated_at
                        ? formatLastActive(profile.updated_at) + " (based on last update)"
                        : "Not available"}
                  </dd>
                </div>

                {profile?.role === "admin" ? (
                  <>
                  </>
                ) : profile?.role === "counselor" ? (
                  <>
                    <div className="col-span-1 border-t border-gray-200 pt-4 mt-2">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Counselor Profile</h3>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Credentials
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile?.credentials || "Not set"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Years of Experience
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile?.years_experience ? `${profile.years_experience} years` : "Not set"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Specializations
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile?.specializations && Array.isArray(profile.specializations) && profile.specializations.length > 0
                          ? profile.specializations.map((spec, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-2">
                                {spec}
                              </span>
                            ))
                          : "Not set"}
                      </dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-1 border-t border-gray-200 pt-4 mt-2">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Mental Health Profile</h3>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Mental Health Interests
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile?.mental_health_interests && Array.isArray(profile.mental_health_interests) && profile.mental_health_interests.length > 0
                          ? profile.mental_health_interests.map((interest, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-2">
                                {interest}
                              </span>
                            ))
                          : "Not set"}
                      </dd>
                    </div>
                  </>
                )}

                {profile?.role !== "counselor" && profile?.role !== "admin" && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Support Preferences
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {profile?.support_preferences && Array.isArray(profile.support_preferences) && profile.support_preferences.length > 0
                        ? profile.support_preferences.map((pref, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2 mb-2">
                              {pref}
                            </span>
                          ))
                        : "Not set"}
                    </dd>
                  </div>
                )}

                {profile?.role === "counselor" && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Availability Hours
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {profile?.availability_hours || "Not set"}
                    </dd>
                  </div>
                )}

                {profile?.role !== "counselor" && profile?.role !== "admin" && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Comfort Level with Sharing
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {profile?.comfort_level_sharing
                        ? profile.comfort_level_sharing === 'private'
                          ? "Private - Prefer minimal sharing"
                          : profile.comfort_level_sharing === 'moderate'
                            ? "Moderate - Comfortable with some sharing"
                            : "Open - Comfortable sharing most experiences"
                        : "Not set"}
                    </dd>
                  </div>
                )}

                {profile?.role === "counselor" && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Professional Bio
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {profile?.professional_bio || "Not set"}
                    </dd>
                  </div>
                )}

                {profile?.role !== "admin" && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Preferred Contact Method
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {profile?.preferred_contact_method
                        ? profile.preferred_contact_method === 'app'
                          ? "In-App Messaging"
                          : profile.preferred_contact_method === 'email'
                            ? "Email"
                            : profile.preferred_contact_method === 'phone'
                              ? "Phone"
                              : "Video Call"
                        : "Not set"}
                    </dd>
                  </div>
                )}

                {profile?.role !== "counselor" && profile?.role !== "admin" && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Emergency Contact
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile?.emergency_contact || "Not set"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Mental Health Goals
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile?.goals || "Not set"}
                      </dd>
                    </div>
                  </>
                )}

                {profile?.role !== "counselor" && profile?.role !== "admin" && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Preferred Resources
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile?.preferred_resources && Array.isArray(profile.preferred_resources) && profile.preferred_resources.length > 0
                          ? profile.preferred_resources.map((resource, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2 mb-2">
                                {resource}
                              </span>
                            ))
                          : "Not set"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Triggers
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile?.triggers && Array.isArray(profile.triggers) && profile.triggers.length > 0
                          ? profile.triggers.map((trigger, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2 mb-2">
                                {trigger}
                              </span>
                            ))
                          : "Not set"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Coping Strategies
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile?.coping_strategies && Array.isArray(profile.coping_strategies) && profile.coping_strategies.length > 0
                          ? profile.coping_strategies.map((strategy, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2 mb-2">
                                {strategy}
                              </span>
                            ))
                          : "Not set"}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainComponent;