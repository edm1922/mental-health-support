import { supabase } from '../../../utils/supabaseClient';

async function handler() {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized - Please login" };
  }

  try {
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (adminCheckError || !adminCheck || adminCheck.role !== "admin") {
      return { error: "Unauthorized - Admin access required" };
    }

    const { data: applications, error: applicationsError } = await supabase
      .from('counselor_applications')
      .select(`
        ca.*,
        au.name,
        au.email,
        up.display_name,
        up.role
      `)
      .leftJoin('auth_users au', 'au.id::text', 'ca.user_id')
      .leftJoin('user_profiles up', 'up.user_id', 'ca.user_id')
      .order('ca.created_at', { ascending: false });

    if (applicationsError) {
      return { error: "Failed to fetch counselor applications" };
    }

    return { applications };
  } catch (error) {
    return { error: "Failed to fetch counselor applications" };
  }
}

export default handler;