/**
 * Cleanup script to remove redundant files
 * Run with: node scripts/cleanup.js
 */

const fs = require('fs');
const path = require('path');

// Files to be removed (relative to project root)
const filesToRemove = [
  // Test scripts that are no longer needed
  'test-admin-signup.js',
  'test-api-endpoint.js',
  'test-db.js',
  'test-db-connection.js',
  'test-foreign-key.js',
  'test-modified-signup.js',
  'test-new-user.js',
  'test-signin.js',
  'test-signin-existing.js',
  'test-signup.js',
  'test-signup-flow.js',
  'test-signup-function.js',
  'test-signup-process.js',
  'test-signup-terminal.js',
  'test-supabase.js',
  
  // Redundant SQL scripts
  'check-auth-schema.sql',
  'check-column-names.sql',
  'check-columns-simple.sql',
  'check-counseling-sessions.sql',
  'check-database.sql',
  'check-database-alt.sql',
  'check-foreign-key.sql',
  'check-primary-key.sql',
  'check-rls.sql',
  'check-table-structure.sql',
  'diagnose-auth-issues.sql',
  'diagnose-auth-issues-fixed.sql',
  
  // Debug/test API routes
  'src/app/api/debug/route.js',
  'src/app/api/debug/auth-status/route.js',
  'src/app/api/debug/auth-test/route.js',
  'src/app/api/debug/rls-policies/route.js',
  'src/app/api/debug/session/route.js',
  'src/app/api/debug/user/route.js',
  'src/app/api/auth-test/route.js',
  'src/app/api/supabase-test/route.js',
  'src/app/api/test/create-profile/route.js',
  'src/app/api/test/create-user/route.js',
  'src/app/api/messages/create-test-users/route.js',
  'src/app/api/messages/debug/route.js',
  'src/app/api/messages/test-insert/route.js',
  'src/app/api/forum/create-test-post/route.js',
  'src/app/api/forum/test-post/route.js',
];

// Function to safely remove a file
function safelyRemoveFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error removing ${filePath}:`, error.message);
    return false;
  }
}

// Main function to remove files
function cleanupFiles() {
  console.log('Starting cleanup process...');
  
  const projectRoot = path.resolve(__dirname, '..');
  let removedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;
  
  for (const file of filesToRemove) {
    const fullPath = path.join(projectRoot, file);
    const result = safelyRemoveFile(fullPath);
    
    if (result) {
      removedCount++;
    } else if (fs.existsSync(fullPath)) {
      errorCount++;
    } else {
      notFoundCount++;
    }
  }
  
  console.log('\nCleanup Summary:');
  console.log(`✅ Successfully removed: ${removedCount} files`);
  console.log(`⚠️ Files not found: ${notFoundCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('\nCleanup process completed.');
}

// Run the cleanup
cleanupFiles();
