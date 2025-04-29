import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export async function GET() {
  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      console.log("No session or user ID");
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
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
      return NextResponse.json({ error: "Error fetching user profile" }, { status: 500 });
    }

    console.log("User profile:", userProfile);

    if (!userProfile || userProfile.role !== "admin") {
      console.log("User is not admin:", userProfile?.role);
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    // Get all applications
    const { data: applications, error: applicationsError } = await supabase
      .from('counselor_applications')
      .select(`
        *,
        user_profiles:user_id (
          display_name,
          phone
        ),
        auth_users:user_id (
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (applicationsError) {
      console.error("Error fetching applications:", applicationsError);
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }

    return NextResponse.json({ applications: applications || [] });
  } catch (error) {
    console.error("Error in counselor applications API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { applicationId, status, action } = body;

    // Validate request
    if (!applicationId || !status || action !== "update") {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be approved or rejected" }, { status: 400 });
    }

    // Update application status
    const { error: updateError } = await supabase
      .from('counselor_applications')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json({ error: "Failed to update application status" }, { status: 500 });
    }

    // If approved, update user role to counselor
    if (status === "approved") {
      // Get the user_id from the application
      const { data: application } = await supabase
        .from('counselor_applications')
        .select('user_id')
        .eq('id', applicationId)
        .single();

      if (application) {
        const { error: roleUpdateError } = await supabase
          .from('user_profiles')
          .update({ 
            role: 'counselor',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', application.user_id);

        if (roleUpdateError) {
          console.error("Error updating user role:", roleUpdateError);
          return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
    });
  } catch (error) {
    console.error("Error in counselor applications API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
