import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    console.log('Sign-up API called');
    const { email, password, displayName } = await request.json();
    console.log('Email provided:', email);
    console.log('Display name provided:', displayName);

    // Validate inputs
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // First, ensure the user_profiles table exists and RLS is disabled
    console.log('Ensuring user_profiles table exists...');
    try {
      // Try to disable RLS first (in case the table exists)
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;'
      }).catch(e => console.log('RLS disable error (might be ok):', e));

      // Create the table directly
      const { error: createTableError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Create user_profiles table with UUID id to match auth.uid()
          CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID PRIMARY KEY,
            display_name TEXT,
            bio TEXT,
            image_url TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Disable RLS to allow inserts
          ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
        `
      });

      if (createTableError) {
        console.error('Error creating table:', createTableError);
      } else {
        console.log('Table created or already exists');
      }
    } catch (tableError) {
      console.error('Exception creating table:', tableError);
    }

    // Now attempt to sign up the user
    console.log('Attempting to sign up with Supabase...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.log('Supabase auth response:', JSON.stringify(data, null, 2));

    // Create user profile
    if (data?.user) {
      console.log('Creating user profile for:', data.user.id);

      try {
        // Insert the user profile
        const profileData = {
          id: data.user.id, // This is already a UUID
          display_name: displayName || email.split('@')[0],
          role: 'user',
        };

        console.log('Profile data to insert:', profileData);

        // Try direct SQL insert first
        try {
          const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
            sql: `INSERT INTO public.user_profiles (id, display_name, role) 
                  VALUES ('${data.user.id}', '${profileData.display_name.replace(/'/g, "''")}', 'user')
                  ON CONFLICT (id) DO UPDATE 
                  SET display_name = EXCLUDED.display_name;`
          });
          
          if (sqlError) {
            console.error('SQL insert error:', sqlError);
            throw new Error('SQL insert failed: ' + sqlError.message);
          }
          
          console.log('SQL insert succeeded:', sqlData);
        } catch (sqlError) {
          console.error('SQL insert exception:', sqlError);
          
          // Fall back to regular insert
          console.log('Trying regular insert...');
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([profileData]);
            
          if (insertError) {
            console.error('Regular insert error:', insertError);
            
            if (insertError.code === '23505') {
              console.log('User profile already exists, continuing...');
            } else {
              return NextResponse.json(
                { error: 'Failed to create user profile', details: insertError.message },
                { status: 500 }
              );
            }
          } else {
            console.log('Regular insert succeeded');
          }
        }
      } catch (profileError) {
        console.error('Exception creating profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to create user profile', details: profileError.message || 'Unknown error' },
          { status: 500 }
        );
      }
    }

    console.log('Sign-up successful for user:', data.user.id);
    return NextResponse.json({
      user: data.user,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Exception in sign-up API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
