const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://euebogudyyeodzkvhyef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjM5NDgsImV4cCI6MjA2MDQzOTk0OH0.b68JOxrpuFwWb2K3DraYvv32uqomvK0r1imbOCG0HKc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCounselorAuth() {
  console.log('Testing counselor authentication and redirection...');
  console.log('Email: counselor1@example.com');
  console.log('Password: counselor');

  try {
    // Step 1: Use the API endpoint to sign in (simulating the form submission)
    console.log('\nStep 1: Submitting sign-in form via API...');
    const signInResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'counselor1@example.com',
        password: 'counselor'
      })
    });

    if (!signInResponse.ok) {
      console.error('Sign-in API error:', signInResponse.status, signInResponse.statusText);
      const errorText = await signInResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const signInData = await signInResponse.json();
    console.log('Sign-in API response:', signInData.user ? 'User authenticated' : 'Authentication failed');

    if (!signInData.user) {
      console.error('No user returned from sign-in API');
      return;
    }

    console.log('User ID:', signInData.user.id);

    // Step 2: Sign in with Supabase directly to get a session
    console.log('\nStep 2: Authenticating with Supabase to get session...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'counselor1@example.com',
      password: 'counselor',
    });

    if (error) {
      console.error('Supabase sign-in error:', error.message);
      return;
    }

    console.log('Supabase sign-in successful!');
    console.log('Session:', data.session ? 'Valid session created' : 'No session created');

    // Step 3: Get user profile
    console.log('\nStep 3: Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, display_name')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError.message);
      return;
    }

    console.log('User profile:', profile);
    console.log('User role:', profile.role);

    // Step 4: Determine redirect URL
    let redirectUrl = '/home';
    if (profile.role === 'counselor') {
      redirectUrl = '/counselor/dashboard';
    } else if (profile.role === 'admin') {
      redirectUrl = '/admin/dashboard';
    }

    console.log('\nStep 4: Redirection logic:');
    console.log(`User role is '${profile.role}', should redirect to: ${redirectUrl}`);

    // Step 5: Test client-side redirection
    console.log('\nStep 5: Testing client-side redirection...');
    console.log('Note: Client-side redirection cannot be tested directly from Node.js.');
    console.log('However, we can verify that the sign-in API returns the correct redirect URL.');

    // Call the sign-in API again to check the redirect URL
    const signInApiResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'counselor1@example.com',
        password: 'counselor'
      })
    });

    if (!signInApiResponse.ok) {
      console.error('Sign-in API error:', signInApiResponse.status, signInApiResponse.statusText);
      const errorText = await signInApiResponse.text();
      console.error('Error details:', errorText);
    } else {
      const signInApiData = await signInApiResponse.json();
      console.log('Sign-in API redirect URL:', signInApiData.redirectUrl);

      if (signInApiData.redirectUrl === redirectUrl) {
        console.log(`✅ Correct redirect URL returned from API: ${redirectUrl}`);
      } else {
        console.log(`❌ Incorrect redirect URL. Expected: ${redirectUrl}, Actual: ${signInApiData.redirectUrl}`);
      }
    }

    // Step 6: Test accessing the counselor dashboard
    console.log('\nStep 6: Testing access to counselor dashboard...');
    const dashboardResponse = await fetch(`http://localhost:3000${redirectUrl}`, {
      headers: {
        'Authorization': `Bearer ${data.session.access_token}`,
        'Cookie': `sb-access-token=${data.session.access_token}; sb-refresh-token=${data.session.refresh_token}`
      }
    });

    console.log('Dashboard response status:', dashboardResponse.status);

    if (dashboardResponse.status === 200) {
      console.log(`✅ Successfully accessed ${redirectUrl}!`);
    } else if (dashboardResponse.status === 302) {
      const location = dashboardResponse.headers.get('location');
      console.log(`Redirect detected to: ${location}`);
    } else {
      console.log(`❌ Failed to access ${redirectUrl}`);
    }

    console.log('\nTest completed!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testCounselorAuth();
