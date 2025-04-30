async function handler() {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized - Please login", applications: [] };
  }

import { supabase } from '../../../utils/supabaseClient';

const { data: userProfile, error: userProfileError } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('user_id', session.user.id)
  .single();

if (userProfileError) {
  console.error("Error fetching user profile:", userProfileError);
  return { error: "Failed to fetch user profile", applications: [] };
}

  if (!userProfile?.[0] || userProfile[0].role !== "admin") {
    return { error: "Unauthorized - Admin access required", applications: [] };
  }

  try {
    const applications = await sql`
      SELECT 
        ca.*,
        up.display_name,
        up.email,
        au.email as user_email
      FROM counselor_applications ca
      LEFT JOIN user_profiles up ON ca.user_id = up.user_id
      LEFT JOIN auth_users au ON ca.user_id = au.id::text
      ORDER BY ca.created_at DESC
    `;

    return { applications, error: null };
  } catch (err) {
    console.error("Database error:", err);
    return { error: "Failed to fetch applications", applications: [] };
  }
}