async function handler({
  credentials,
  yearsExperience,
  specializations,
  summary,
  phone,
  licenseUrl,
}) {
  const session = getSession();
  console.log("Received application submission:", {
    credentials,
    yearsExperience:
      typeof yearsExperience === "string"
        ? parseInt(yearsExperience)
        : yearsExperience,
    specializations,
    summary,
    phone,
    licenseUrl,
    userId: session?.user?.id,
  });

  if (!session?.user?.id) {
    console.log("No session found");
    return { error: "Not authenticated" };
  }

  if (typeof yearsExperience === "string") {
    yearsExperience = parseInt(yearsExperience);
  }

  if (
    !credentials ||
    !yearsExperience ||
    !specializations ||
    !summary ||
    !phone ||
    !licenseUrl
  ) {
    console.log("Missing required fields:", {
      hasCredentials: !!credentials,
      hasYearsExperience: !!yearsExperience,
      hasSpecializations: !!specializations,
      hasSummary: !!summary,
      hasPhone: !!phone,
      hasLicenseUrl: !!licenseUrl,
    });
    return { error: "All fields are required" };
  }

  try {
    // Check if user already has a pending application
    const existingApplication = await sql`
      SELECT id, status FROM counselor_applications
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (existingApplication?.[0]) {
      if (existingApplication[0].status === "pending") {
        return { error: "You already have a pending application" };
      }
      if (existingApplication[0].status === "approved") {
        return { error: "You are already approved as a counselor" };
      }
    }

    console.log("Attempting to insert application into database");
    const [application] = await sql`
      INSERT INTO counselor_applications (
        user_id,
        credentials,
        years_experience,
        specializations,
        summary,
        phone,
        license_url,
        status
      )
      VALUES (
        ${session.user.id},
        ${credentials},
        ${yearsExperience},
        ${specializations},
        ${summary},
        ${phone},
        ${licenseUrl},
        'pending'
      )
      RETURNING *
    `;
    console.log("Successfully created application:", application);

    return { success: true, application };
  } catch (error) {
    console.error("Error submitting counselor application:", error);
    return { error: "Failed to submit application" };
  }
}