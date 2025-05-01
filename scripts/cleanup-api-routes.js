/**
 * Cleanup script to remove redundant API routes
 * Run with: node scripts/cleanup-api-routes.js
 */

const fs = require('fs');
const path = require('path');

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

// Function to safely remove a directory if it's empty
function safelyRemoveEmptyDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        fs.rmdirSync(dirPath);
        console.log(`✅ Removed empty directory: ${dirPath}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`❌ Error removing directory ${dirPath}:`, error.message);
    return false;
  }
}

// Function to recursively clean up empty directories
function cleanupEmptyDirs(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  let files = fs.readdirSync(dirPath);
  
  if (files.length > 0) {
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        cleanupEmptyDirs(fullPath);
      }
    });
    
    // Check again after cleaning subdirectories
    files = fs.readdirSync(dirPath);
  }
  
  if (files.length === 0) {
    safelyRemoveEmptyDir(dirPath);
  }
}

// Main function to remove redundant API routes
async function cleanupApiRoutes() {
  console.log('Starting API routes cleanup process...');
  
  const projectRoot = path.resolve(__dirname, '..');
  const apiDir = path.join(projectRoot, 'src', 'app', 'api');
  
  // List of patterns to match for redundant API routes
  const patterns = [
    /debug/i,
    /test/i,
    /fix/i,
    /direct-/i,
    /bypass/i
  ];
  
  let removedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;
  let removedDirs = 0;
  
  // Function to recursively scan directories
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Check if directory name matches any pattern
        const shouldRemoveDir = patterns.some(pattern => pattern.test(entry.name));
        
        if (shouldRemoveDir) {
          console.log(`🔍 Found redundant API directory: ${fullPath}`);
          
          // Remove all files in the directory
          const dirFiles = fs.readdirSync(fullPath, { withFileTypes: true });
          let allFilesRemoved = true;
          
          for (const file of dirFiles) {
            const filePath = path.join(fullPath, file.name);
            if (file.isFile()) {
              const result = safelyRemoveFile(filePath);
              if (result) {
                removedCount++;
              } else if (fs.existsSync(filePath)) {
                errorCount++;
                allFilesRemoved = false;
              } else {
                notFoundCount++;
              }
            } else if (file.isDirectory()) {
              // Recursively scan subdirectories
              scanDir(filePath);
            }
          }
          
          // Try to remove the directory if all files were removed
          if (allFilesRemoved) {
            const removed = safelyRemoveEmptyDir(fullPath);
            if (removed) removedDirs++;
          }
        } else {
          // Recursively scan subdirectories
          scanDir(fullPath);
        }
      } else if (entry.isFile() && entry.name === 'route.js') {
        // Check if file path matches any pattern
        const relativePath = path.relative(projectRoot, fullPath);
        const shouldRemoveFile = patterns.some(pattern => pattern.test(relativePath));
        
        if (shouldRemoveFile) {
          console.log(`🔍 Found redundant API route: ${relativePath}`);
          const result = safelyRemoveFile(fullPath);
          
          if (result) {
            removedCount++;
          } else if (fs.existsSync(fullPath)) {
            errorCount++;
          } else {
            notFoundCount++;
          }
        }
      }
    }
  }
  
  // Start scanning from the API directory
  scanDir(apiDir);
  
  // Clean up empty directories
  cleanupEmptyDirs(apiDir);
  
  console.log('\nAPI Routes Cleanup Summary:');
  console.log(`✅ Successfully removed: ${removedCount} files`);
  console.log(`📁 Removed empty directories: ${removedDirs}`);
  console.log(`⚠️ Files not found: ${notFoundCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('\nAPI routes cleanup process completed.');
}

// Run the cleanup
cleanupApiRoutes();
