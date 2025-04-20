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
  ModernTextarea,
  ModernHeading,
  ModernAlert,
  ModernInput,
  ModernSelect,
  ModernCheckbox,
  ModernFormGroup,
  ModernLabel,
  ModernCard,
  ModernSpinner
} from "@/components/ui/ModernUI";

// Function to format the last active timestamp in a user-friendly way
function formatLastActive(timestamp) {
  if (!timestamp) return 'Just now';
  
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

export default function ModernProfilePage() {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      
      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
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
        setError(data.error || "Failed to create profile");
        return false;
      }

      return true;
    } catch (err) {
      setError("Failed to create profile: " + (err.message || "Unknown error"));
      return false;
    }
  };

  // Function to load profile data
  const loadProfile = async () => {
    try {
      setError(null);
      setRefreshing(true);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
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
        setError(data.error || "Failed to load profile");
        return false;
      }

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
      setError("Failed to load profile: " + (err.message || "Unknown error"));
      return false;
    } finally {
      setRefreshing(false);
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
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
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

      const data = await response.json();

      if (response.ok) {
        if (data.profile) {
          setProfile(data.profile);
          setSuccess(true);
          setIsEditing(false);
          
          // Force a reload of the profile data after a short delay
          setTimeout(() => {
            loadProfile();
          }, 500);
        } else {
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
        let errorMessage = data.error || "Failed to update profile";
        if (data.details) {
          errorMessage += `: ${data.details}`;
        }

        // If we get a row-level security error, try to create the profile first
        if (errorMessage.includes('row-level security policy')) {
          const profileCreated = await ensureProfileExists();

          if (profileCreated) {
            // Try the update again
            await handleSubmit(e);
            return;
          }
        }

        setError(errorMessage);
      }
    } catch (err) {
      setError("Failed to update profile: " + (err.message || 'Unknown error'));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle array fields separately
    if (['mentalHealthInterests', 'supportPreferences', 'preferredResources', 'triggers', 'copingStrategies', 'specializations'].includes(name)) {
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

  if (userLoading) {
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
            Please sign in to view your profile settings.
          </p>
          <ModernButton
            onClick={() => router.push('/account/signin')}
          >
            Sign In
          </ModernButton>
        </GlassCard>
      </GlassContainer>
    );
  }

  return (
    <GlassContainer>
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="flex items-center justify-between mb-6">
        <ModernHeading level={1}>Profile Settings</ModernHeading>
        <div className="flex space-x-3">
          <ModernButton 
            variant="outline" 
            onClick={loadProfile}
            disabled={refreshing}
          >
            {refreshing ? (
              <span className="flex items-center">
                <ModernSpinner size="small" className="mr-2" />
                Refreshing...
              </span>
            ) : (
              "Refresh"
            )}
          </ModernButton>
          <ModernButton 
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </ModernButton>
        </div>
      </div>

      {error && (
        <ModernAlert type="error" className="mb-6">
          {error}
        </ModernAlert>
      )}

      {success && (
        <ModernAlert type="success" className="mb-6">
          Profile updated successfully!
        </ModernAlert>
      )}

      <GlassCard className="mb-6">
        <div className="mb-4 flex items-center">
          <div className="h-12 w-12 rounded-full bg-[#357AFF] flex items-center justify-center text-white text-xl font-bold mr-4">
            {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{profile?.display_name || "Set your display name"}</h2>
            <p className="text-gray-500">
              Current Role: <span className="capitalize">{profile?.role || "User"}</span>
              {profile?.role === "admin" && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Admin Access
                </span>
              )}
            </p>
            <p className="text-gray-500 text-sm">
              Last active: {profile?.last_active ? formatLastActive(profile.last_active) : "Just now"}
            </p>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <ModernFormGroup>
              <ModernLabel htmlFor="displayName">Display Name</ModernLabel>
              <ModernInput
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="Your display name"
              />
            </ModernFormGroup>

            <ModernFormGroup>
              <ModernLabel htmlFor="bio">Bio</ModernLabel>
              <ModernTextarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
                rows={3}
              />
            </ModernFormGroup>

            {profile?.role !== "admin" && (
              <ModernFormGroup>
                <ModernLabel htmlFor="preferredContactMethod">Preferred Contact Method</ModernLabel>
                <ModernSelect
                  id="preferredContactMethod"
                  name="preferredContactMethod"
                  value={formData.preferredContactMethod}
                  onChange={handleInputChange}
                  options={[
                    { value: "app", label: "In-App Messaging" },
                    { value: "email", label: "Email" },
                    { value: "phone", label: "Phone" },
                    { value: "video", label: "Video Call" }
                  ]}
                />
              </ModernFormGroup>
            )}

            {profile?.role === "counselor" && (
              <>
                <ModernFormGroup>
                  <ModernLabel htmlFor="credentials">Credentials</ModernLabel>
                  <ModernInput
                    id="credentials"
                    name="credentials"
                    value={formData.credentials || ""}
                    onChange={handleInputChange}
                    placeholder="Your professional credentials"
                  />
                </ModernFormGroup>

                <ModernFormGroup>
                  <ModernLabel htmlFor="yearsExperience">Years of Experience</ModernLabel>
                  <ModernInput
                    id="yearsExperience"
                    name="yearsExperience"
                    type="number"
                    value={formData.yearsExperience || ""}
                    onChange={handleInputChange}
                    placeholder="Number of years"
                  />
                </ModernFormGroup>

                <ModernFormGroup>
                  <ModernLabel htmlFor="specializations">Specializations</ModernLabel>
                  <ModernInput
                    id="specializations"
                    name="specializations"
                    value={(formData.specializations || []).join(", ")}
                    onChange={handleInputChange}
                    placeholder="Anxiety, Depression, etc. (comma separated)"
                  />
                </ModernFormGroup>

                <ModernFormGroup>
                  <ModernLabel htmlFor="availabilityHours">Availability Hours</ModernLabel>
                  <ModernInput
                    id="availabilityHours"
                    name="availabilityHours"
                    value={formData.availabilityHours || ""}
                    onChange={handleInputChange}
                    placeholder="Mon-Fri 9am-5pm"
                  />
                </ModernFormGroup>

                <ModernFormGroup>
                  <ModernLabel htmlFor="professionalBio">Professional Bio</ModernLabel>
                  <ModernTextarea
                    id="professionalBio"
                    name="professionalBio"
                    value={formData.professionalBio || ""}
                    onChange={handleInputChange}
                    placeholder="Your professional background and approach"
                    rows={4}
                  />
                </ModernFormGroup>
              </>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <ModernButton
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </ModernButton>
              <ModernButton type="submit">
                Save Changes
              </ModernButton>
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
            {profile?.role !== "admin" && (
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
            )}
            {profile?.role === "counselor" && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Credentials</h3>
                  <p className="mt-1">{profile?.credentials || "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Years of Experience</h3>
                  <p className="mt-1">{profile?.years_experience ? `${profile.years_experience} years` : "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Specializations</h3>
                  <p className="mt-1">
                    {profile?.specializations?.length > 0
                      ? profile.specializations.join(", ")
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Availability Hours</h3>
                  <p className="mt-1">{profile?.availability_hours || "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Professional Bio</h3>
                  <p className="mt-1">{profile?.professional_bio || "Not set"}</p>
                </div>
              </>
            )}
          </div>
        )}
      </GlassCard>

      {profile?.role !== "admin" && profile?.role !== "counselor" && (
        <>
          <ModernHeading level={2}>Mental Health Profile</ModernHeading>

          <GlassCard className="mb-6">
            {isEditing ? (
              <div className="space-y-6">
                <ModernFormGroup>
                  <ModernLabel htmlFor="mentalHealthInterests">Mental Health Interests</ModernLabel>
                  <ModernInput
                    id="mentalHealthInterests"
                    name="mentalHealthInterests"
                    value={formData.mentalHealthInterests.join(", ")}
                    onChange={handleInputChange}
                    placeholder="Anxiety, Depression, Mindfulness, etc. (comma separated)"
                  />
                </ModernFormGroup>

                <ModernFormGroup>
                  <ModernLabel htmlFor="supportPreferences">Support Preferences</ModernLabel>
                  <ModernInput
                    id="supportPreferences"
                    name="supportPreferences"
                    value={formData.supportPreferences.join(", ")}
                    onChange={handleInputChange}
                    placeholder="One-on-one, Group sessions, etc. (comma separated)"
                  />
                </ModernFormGroup>

                <ModernFormGroup>
                  <ModernLabel htmlFor="comfortLevelSharing">Comfort Level with Sharing</ModernLabel>
                  <ModernSelect
                    id="comfortLevelSharing"
                    name="comfortLevelSharing"
                    value={formData.comfortLevelSharing}
                    onChange={handleInputChange}
                    options={[
                      { value: "low", label: "Low - Prefer to keep things private" },
                      { value: "moderate", label: "Moderate - Comfortable with some sharing" },
                      { value: "high", label: "High - Open to sharing most things" }
                    ]}
                  />
                </ModernFormGroup>

                <ModernFormGroup>
                  <ModernLabel htmlFor="emergencyContact">Emergency Contact</ModernLabel>
                  <ModernInput
                    id="emergencyContact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="Name and contact information"
                  />
                </ModernFormGroup>

                <ModernFormGroup>
                  <ModernLabel htmlFor="goals">Mental Health Goals</ModernLabel>
                  <ModernTextarea
                    id="goals"
                    name="goals"
                    value={formData.goals}
                    onChange={handleInputChange}
                    placeholder="What are your mental health goals?"
                    rows={3}
                  />
                </ModernFormGroup>

                <ModernFormGroup>
                  <ModernLabel htmlFor="preferredResources">Preferred Resources</ModernLabel>
                  <ModernInput
                    id="preferredResources"
                    name="preferredResources"
                    value={formData.preferredResources.join(", ")}
                    onChange={handleInputChange}
                    placeholder="Articles, Videos, Exercises, etc. (comma separated)"
                  />
                </ModernFormGroup>

                <ModernFormGroup>
                  <ModernLabel htmlFor="triggers">Triggers</ModernLabel>
                  <ModernInput
                    id="triggers"
                    name="triggers"
                    value={formData.triggers.join(", ")}
                    onChange={handleInputChange}
                    placeholder="Topics or situations that may trigger you (comma separated)"
                  />
                </ModernFormGroup>

                <ModernFormGroup>
                  <ModernLabel htmlFor="copingStrategies">Coping Strategies</ModernLabel>
                  <ModernInput
                    id="copingStrategies"
                    name="copingStrategies"
                    value={formData.copingStrategies.join(", ")}
                    onChange={handleInputChange}
                    placeholder="Strategies that help you cope (comma separated)"
                  />
                </ModernFormGroup>
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
          </GlassCard>
        </>
      )}
    </GlassContainer>
  );
}
