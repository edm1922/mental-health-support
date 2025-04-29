"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { useUserProfile } from "@/utils/useUserProfile";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
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

function ProfilePage() {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const { profile, loading: profileLoading } = useUserProfile();
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

  // Load profile data when component mounts
  useEffect(() => {
    if (profile && !profileLoading) {
      setFormData({
        displayName: profile.display_name || "",
        bio: profile.bio || "",
        mentalHealthInterests: profile.mental_health_interests || [],
        supportPreferences: profile.support_preferences || [],
        comfortLevelSharing: profile.comfort_level_sharing || "moderate",
        preferredContactMethod: profile.preferred_contact_method || "app",
        emergencyContact: profile.emergency_contact || "",
        goals: profile.goals || "",
        preferredResources: profile.preferred_resources || [],
        triggers: profile.triggers || [],
        copingStrategies: profile.coping_strategies || []
      });
    }
  }, [profile, profileLoading]);

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

      // Prepare the request body
      const requestBody = {
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

      // Update profile
      const response = await fetch("/api/update-expanded-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess(true);
      setIsEditing(false);
      
      // Refresh the profile data
      window.location.reload();
    } catch (err) {
      setError("Failed to update profile: " + (err.message || "Unknown error"));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      window.location.reload();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (userLoading || profileLoading) {
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
            onClick={() => window.location.href = "/account/signin"}
          >
            Sign In
          </ModernButton>
        </GlassCard>
      </GlassContainer>
    );
  }

  return (
    <GlassContainer>
      <BackButton />

      <div className="flex items-center justify-between mb-6">
        <ModernHeading level={1}>Profile Settings</ModernHeading>
        <div className="flex space-x-3">
          <ModernButton 
            variant="outline" 
            onClick={handleRefresh}
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
          {!isEditing && (
            <ModernButton onClick={() => setIsEditing(true)}>
              Edit Profile
            </ModernButton>
          )}
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
            <p className="text-gray-500">Current Role: {profile?.role || "User"}</p>
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
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Active</h3>
              <p className="mt-1">{profile?.last_active ? new Date(profile.last_active).toLocaleString() : "Just now"}</p>
            </div>
          </div>
        )}
      </GlassCard>

      <ModernHeading level={2}>Mental Health Profile</ModernHeading>

      <GlassCard className="mb-6">
        {isEditing ? (
          <form className="space-y-6">
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
          </form>
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

            <div className="md:col-span-2">
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
    </GlassContainer>
  );
}

export default ProfilePage;
