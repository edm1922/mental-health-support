import { supabase } from '@/utils/supabaseClient';

// Function to get the current session
async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export default async function handler(params) {
  const session = await getSession();
  if (!session?.user?.id) {
    console.log("No session or user ID");
    return { error: "Unauthorized - Please log in" };
  }

  console.log("Session user ID:", session.user.id);

  // Get user profile to check role
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
    return { error: "Failed to fetch user profile" };
  }

  console.log("User profile:", userProfile);

  if (!userProfile || userProfile.role !== "admin") {
    console.log("User is not admin:", userProfile?.role);
    return { error: "Unauthorized - Admin access required" };
  }

  // If params are provided, handle update action
  if (params?.applicationId && params?.status && params?.action === "update") {
    if (!["approved", "rejected"].includes(params.status)) {
      return { error: "Invalid status. Must be approved or rejected" };
    }

    try {
      // Start a transaction
      const { error: transactionError } = await supabase.rpc('exec_sql', {
        sql: `
          BEGIN;

          -- Update application status
          UPDATE counselor_applications
          SET status = '${params.status}',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = '${params.applicationId}';

          ${params.status === "approved" ? `
          -- If approved, update user role to counselor
          UPDATE user_profiles
          SET role = 'counselor',
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = (
            SELECT user_id FROM counselor_applications
            WHERE id = '${params.applicationId}'
          );
          ` : ''}

          COMMIT;
        `
      });

      if (transactionError) {
        throw transactionError;
      }

      return {
        success: true,
        message: `Application ${params.status} successfully`,
      };
    } catch (error) {
      console.error("Error updating application:", error);
      return { error: "Failed to update application status" };
    }
  }

  // Default behavior: List all applications with user information
  const startTime = Date.now(); // Start time for performance measurement
  try {
    // First check if there are any applications at all
    const { data: allApplications, error: applicationsError } = await supabase
      .from('counselor_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (applicationsError) {
      throw applicationsError;
    }

    const endTime = Date.now(); // End time for performance measurement
    console.log("Total applications found:", allApplications.length);
    console.log(`Time taken to fetch all applications: ${endTime - startTime} ms`);
    console.log(
      "Applications by status:",
      allApplications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {})
    );

    // Get all applications with user information
    const { data: applications, error: joinError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          ca.*,
          up.display_name,
          up.phone,
          au.email
        FROM counselor_applications ca
        LEFT JOIN user_profiles up ON ca.user_id = up.user_id
        LEFT JOIN auth_users au ON up.user_id = au.id::text
        ORDER BY
          CASE
            WHEN ca.status = 'pending' THEN 1
            WHEN ca.status = 'approved' THEN 2
            ELSE 3
          END,
          ca.created_at DESC
      `
    });

    if (joinError) {
      throw joinError;
    }

    console.log("Applications with joins:", applications.length);
    console.log(
      "Applications by status after joins:",
      applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {})
    );

    return { applications: applications || [] };
  } catch (error) {
    console.error("Error fetching applications:", error);
    return { applications: [], error: "Failed to fetch applications" };
  }
}