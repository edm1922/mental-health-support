/**
 * Run Database Migration Script
 * 
 * This script runs the database migration to ensure all required tables and columns exist.
 * 
 * Usage:
 * node scripts/run-migration.js
 * 
 * Environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL: The URL of your Supabase project
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: The anonymous key for your Supabase project
 */

// Import the migration function
const { migrateDatabase } = require('../src/scripts/migrate-database');

// Run the migration
console.log('Starting database migration...');
migrateDatabase()
  .then(results => {
    console.log('Migration results:', JSON.stringify(results, null, 2));
    
    if (results.success) {
      console.log('Migration completed successfully!');
      process.exit(0);
    } else {
      console.error('Migration failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Migration failed with error:', error);
    process.exit(1);
  });
