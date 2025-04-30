const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anonymous Key is missing. Please check your environment variables.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQL statements to create tables
const createTablesSql = `
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  image_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create counselor_applications table
CREATE TABLE IF NOT EXISTS public.counselor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  credentials TEXT NOT NULL,
  years_experience INTEGER NOT NULL,
  specializations TEXT NOT NULL,
  summary TEXT NOT NULL,
  license_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mental_health_checkins table
CREATE TABLE IF NOT EXISTS public.mental_health_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  mood_rating INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create counseling_sessions table
CREATE TABLE IF NOT EXISTS public.counseling_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID,
  client_id UUID,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

// SQL statements to create functions
const createFunctionsSql = fs.readFileSync(path.join(__dirname, 'supabase-sql-functions.sql'), 'utf8');

// Function to execute SQL
async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Exception executing SQL:', error);
    return { success: false, error };
  }
}

// Function to test connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('_rpc').select('now()');
    
    if (error) {
      console.error('Connection error:', error);
      return false;
    }
    
    console.log('Connected to Supabase!');
    console.log('Server time:', new Date(data[0].now).toLocaleString());
    return true;
  } catch (error) {
    console.error('Connection exception:', error);
    return false;
  }
}

// Function to get list of tables
async function listTables() {
  try {
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
    
    return data.map(t => t.tablename);
  } catch (error) {
    console.error('Exception fetching tables:', error);
    return [];
  }
}

// Main function
async function main() {
  console.log('Initializing database...');
  
  // Test connection
  const connected = await testConnection();
  
  if (!connected) {
    console.error('Failed to connect to Supabase. Exiting...');
    process.exit(1);
  }
  
  // Create functions
  console.log('Creating SQL functions...');
  const functionsResult = await executeSQL(createFunctionsSql);
  
  if (!functionsResult.success) {
    console.error('Failed to create SQL functions. Continuing anyway...');
  } else {
    console.log('SQL functions created successfully.');
  }
  
  // Get list of existing tables
  const existingTables = await listTables();
  console.log('Existing tables:', existingTables);
  
  // Create tables
  console.log('Creating tables...');
  const tablesResult = await executeSQL(createTablesSql);
  
  if (!tablesResult.success) {
    console.error('Failed to create tables:', tablesResult.error);
    process.exit(1);
  }
  
  console.log('Tables created successfully.');
  
  // Get list of tables after creation
  const finalTables = await listTables();
  console.log('Final tables:', finalTables);
  
  console.log('Database initialization completed successfully!');
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
