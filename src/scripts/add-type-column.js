"use client";
import { supabase } from '../utils/supabaseClient';

export async function addTypeColumn() {
  try {
    console.log('Checking if type column exists in counseling_sessions table...');
    
    // First check if the column already exists
    const { data: columnInfo, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'counseling_sessions')
      .eq('column_name', 'type');
    
    if (columnError) {
      console.error('Error checking for type column:', columnError);
      return {
        success: false,
        error: columnError.message
      };
    }
    
    if (columnInfo && columnInfo.length > 0) {
      console.log('Type column already exists in counseling_sessions table');
      return {
        success: true,
        message: 'Column already exists'
      };
    }
    
    // Column doesn't exist, so add it
    console.log('Adding type column to counseling_sessions table...');
    
    // Use raw SQL to add the column
    const { error: addError } = await supabase.rpc('add_type_column_to_counseling_sessions');
    
    if (addError) {
      console.error('Error adding type column:', addError);
      return {
        success: false,
        error: addError.message
      };
    }
    
    console.log('Type column added successfully to counseling_sessions table');
    return {
      success: true,
      message: 'Column added successfully'
    };
  } catch (error) {
    console.error('Exception adding type column:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
