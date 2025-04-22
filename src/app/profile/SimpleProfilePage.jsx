"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SimpleProfilePage() {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [contactMethod, setContactMethod] = useState("app");

  // Mental health profile state
  const [mentalHealthInterests, setMentalHealthInterests] = useState("");
  const [supportPreferences, setSupportPreferences] = useState("");
  const [comfortLevelSharing, setComfortLevelSharing] = useState("moderate");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [goals, setGoals] = useState("");
  const [preferredResources, setPreferredResources] = useState("");
  const [triggers, setTriggers] = useState("");
  const [copingStrategies, setCopingStrategies] = useState("");

  // Load profile data
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading profile for user:', user.id);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Authentication error - Please sign in again');
        return;
      }

      // First ensure a profile exists
      await fetch("/api/create-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      // Then get the profile
      const response = await fetch("/api/get-basic-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load profile");
        return;
      }

      console.log('Profile loaded:', data);
      setProfile(data);

      // Set form values
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      setContactMethod(data.preferred_contact_method || "app");

      // Set mental health profile values
      setMentalHealthInterests(Array.isArray(data.mental_health_interests) ? data.mental_health_interests.join(", ") : "");
      setSupportPreferences(Array.isArray(data.support_preferences) ? data.support_preferences.join(", ") : "");
      setComfortLevelSharing(data.comfort_level_sharing || "moderate");
      setEmergencyContact(data.emergency_contact || "");
      setGoals(data.goals || "");
      setPreferredResources(Array.isArray(data.preferred_resources) ? data.preferred_resources.join(", ") : "");
      setTriggers(Array.isArray(data.triggers) ? data.triggers.join(", ") : "");
      setCopingStrategies(Array.isArray(data.coping_strategies) ? data.coping_strategies.join(", ") : "");

    } catch (err) {
      console.error('Error loading profile:', err);
      setError("Failed to load profile: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Submitting profile update...');

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Authentication error - Please sign in again');
        setLoading(false);
        return;
      }

      // Prepare the request body
      const requestBody = {
        displayName,
        bio,
        preferredContactMethod: contactMethod,
        // Mental health fields
        mentalHealthInterests: mentalHealthInterests.split(',').map(item => item.trim()).filter(Boolean),
        supportPreferences: supportPreferences.split(',').map(item => item.trim()).filter(Boolean),
        comfortLevelSharing,
        emergencyContact,
        goals,
        preferredResources: preferredResources.split(',').map(item => item.trim()).filter(Boolean),
        triggers: triggers.split(',').map(item => item.trim()).filter(Boolean),
        copingStrategies: copingStrategies.split(',').map(item => item.trim()).filter(Boolean)
      };

      console.log('Update payload:', requestBody);

      // Send the update request
      const response = await fetch("/api/simple-update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Update response:', data);

      if (response.ok) {
        setSuccess(true);
        setIsEditing(false);
        loadProfile(); // Reload the profile
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError("Failed to update profile: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="mb-6">Please sign in to view your profile settings.</p>
          <button
            onClick={() => router.push('/account/signin')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 bg-white/80 px-4 py-2 rounded-lg shadow-sm hover:bg-white/90"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Profile Settings</h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
                Profile updated successfully!
              </div>
            )}

            <div className="mb-6 flex items-center">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold mr-4">
                {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{profile?.display_name || "Set your display name"}</h2>
                <p className="text-gray-500">
                  Current Role: <span className="capitalize">{profile?.role || "User"}</span>
                </p>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your display name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell us about yourself"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Contact Method
                    </label>
                    <select
                      value={contactMethod}
                      onChange={(e) => setContactMethod(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="app">In-App Messaging</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="video">Video Call</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Display Name</h3>
                  <p className="mt-1">{profile?.display_name || "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Bio</h3>
                  <p className="mt-1">{profile?.bio || "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Preferred Contact Method</h3>
                  <p className="mt-1">
                    {profile?.preferred_contact_method === "app"
                      ? "In-App Messaging"
                      : profile?.preferred_contact_method === "email"
                      ? "Email"
                      : profile?.preferred_contact_method === "phone"
                      ? "Phone"
                      : profile?.preferred_contact_method === "video"
                      ? "Video Call"
                      : "In-App Messaging"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mental Health Profile Section */}
        {profile?.role !== "admin" && profile?.role !== "counselor" && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Mental Health Profile</h2>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mental Health Interests
                      </label>
                      <input
                        type="text"
                        value={mentalHealthInterests}
                        onChange={(e) => setMentalHealthInterests(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Anxiety, Depression, Mindfulness, etc. (comma separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Support Preferences
                      </label>
                      <input
                        type="text"
                        value={supportPreferences}
                        onChange={(e) => setSupportPreferences(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="One-on-one, Group sessions, etc. (comma separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comfort Level with Sharing
                      </label>
                      <select
                        value={comfortLevelSharing}
                        onChange={(e) => setComfortLevelSharing(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low - Prefer to keep things private</option>
                        <option value="moderate">Moderate - Comfortable with some sharing</option>
                        <option value="high">High - Open to sharing most things</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Name and contact information"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mental Health Goals
                      </label>
                      <textarea
                        value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="What are your mental health goals?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Resources
                      </label>
                      <input
                        type="text"
                        value={preferredResources}
                        onChange={(e) => setPreferredResources(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Articles, Videos, Exercises, etc. (comma separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Triggers
                      </label>
                      <input
                        type="text"
                        value={triggers}
                        onChange={(e) => setTriggers(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Topics or situations that may trigger you (comma separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Coping Strategies
                      </label>
                      <input
                        type="text"
                        value={copingStrategies}
                        onChange={(e) => setCopingStrategies(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Strategies that help you cope (comma separated)"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Mental Health Interests</h3>
                      <p className="mt-1">
                        {profile?.mental_health_interests?.length > 0
                          ? profile.mental_health_interests.join(", ")
                          : "Not set"}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Support Preferences</h3>
                      <p className="mt-1">
                        {profile?.support_preferences?.length > 0
                          ? profile.support_preferences.join(", ")
                          : "Not set"}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Comfort Level with Sharing</h3>
                      <p className="mt-1 capitalize">
                        {profile?.comfort_level_sharing === "low"
                          ? "Low - Prefer to keep things private"
                          : profile?.comfort_level_sharing === "high"
                          ? "High - Open to sharing most things"
                          : "Moderate - Comfortable with some sharing"}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Emergency Contact</h3>
                      <p className="mt-1">{profile?.emergency_contact || "Not set"}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Mental Health Goals</h3>
                      <p className="mt-1">{profile?.goals || "Not set"}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Preferred Resources</h3>
                      <p className="mt-1">
                        {profile?.preferred_resources?.length > 0
                          ? profile.preferred_resources.join(", ")
                          : "Not set"}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Triggers</h3>
                      <p className="mt-1">
                        {profile?.triggers?.length > 0
                          ? profile.triggers.join(", ")
                          : "Not set"}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Coping Strategies</h3>
                      <p className="mt-1">
                        {profile?.coping_strategies?.length > 0
                          ? profile.coping_strategies.join(", ")
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
