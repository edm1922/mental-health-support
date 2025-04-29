import { supabase } from './supabaseClient';

/**
 * Get a list of all tables in the public schema
 * @returns {Promise<Array>} Array of table names
 */
export async function listTables() {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      throw error;
    }
    
    return data.map(table => table.table_name);
  } catch (error) {
    console.error('Error listing tables:', error);
    return [];
  }
}

/**
 * Get the schema of a specific table
 * @param {string} tableName - The name of the table
 * @returns {Promise<Array>} Array of column information
 */
export async function getTableSchema(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error getting schema for table ${tableName}:`, error);
    return [];
  }
}

/**
 * Test the connection to Supabase
 * @returns {Promise<Object>} Connection status
 */
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('_rpc').select('now()');
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      serverTime: data[0]?.now,
      message: 'Connected to Supabase successfully'
    };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      message: 'Failed to connect to Supabase'
    };
  }
}

/**
 * Create a new table if it doesn't exist
 * @param {string} tableName - The name of the table to create
 * @param {Object} schema - The schema definition
 * @returns {Promise<Object>} Result of the operation
 */
export async function createTableIfNotExists(tableName, schema) {
  try {
    // Check if the table exists
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    // If table exists, return early
    if (tables && tables.length > 0) {
      return {
        success: true,
        message: `Table ${tableName} already exists`,
        created: false
      };
    }
    
    // Create the table using SQL
    const { error } = await supabase.rpc('create_table', {
      table_name: tableName,
      schema_definition: schema
    });
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      message: `Table ${tableName} created successfully`,
      created: true
    };
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      message: `Failed to create table ${tableName}`
    };
  }
}
