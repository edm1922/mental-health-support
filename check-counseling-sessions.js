"use client";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounselingSessionsTable() {
  try {
    // Check table structure
    console.log("Checking counseling_sessions table structure...");
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'counseling_sessions')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error("Error fetching columns:", columnsError);
      return;
    }
    
    console.log("Columns in counseling_sessions table:", columns);
    
    // Try to fetch a sample row
    console.log("Fetching a sample row from counseling_sessions...");
    const { data: sampleRow, error: sampleError } = await supabase
      .from('counseling_sessions')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error("Error fetching sample row:", sampleError);
    } else {
      console.log("Sample row:", sampleRow);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

// Run the check
checkCounselingSessionsTable();
