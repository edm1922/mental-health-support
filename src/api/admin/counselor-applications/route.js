async function handler(params) {
  const session = getSession();
  if (!session?.user?.id) {
    console.log("No session or user ID");
    return { error: "Unauthorized - Please log in" };
  }

  console.log("Session user ID:", session.user.id);

  // Get user profile to check role
  const userProfile = await sql`
    SELECT role FROM user_profiles 
    WHERE user_id = ${session.user.id}
  `;

  console.log("User profile:", userProfile);

  if (!userProfile?.[0] || userProfile[0].role !== "admin") {
    console.log("User is not admin:", userProfile?.[0]?.role);
    return { error: "Unauthorized - Admin access required" };
  }

  // If params are provided, handle update action
  if (params?.applicationId && params?.status && params?.action === "update") {
    if (!["approved", "rejected"].includes(params.status)) {
      return { error: "Invalid status. Must be approved or rejected" };
    }

    try {
      await sql.transaction(async (sql) => {
        // Update application status
        await sql`
          UPDATE counselor_applications 
          SET status = ${params.status}, 
              updated_at = CURRENT_TIMESTAMP 
          WHERE id = ${params.applicationId}
        `;

        // If approved, update user role to counselor
        if (params.status === "approved") {
          const application = await sql`
            SELECT user_id FROM counselor_applications 
            WHERE id = ${params.applicationId}
          `;

          if (application?.[0]) {
            await sql`
              UPDATE user_profiles 
              SET role = 'counselor',
                  updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ${application[0].user_id}
            `;
          }
        }
      });

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
    const allApplications = await sql`
      SELECT * FROM counselor_applications
      ORDER BY created_at DESC
    `;
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
    const applications = await sql`
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
    `;

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