/**
 * Cleanup script to remove unnecessary files
 * Run with: node scripts/cleanup-codebase.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

// Function to safely remove a directory
function safelyRemoveDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      // Check if directory is empty
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        fs.rmdirSync(dirPath);
        console.log(`✅ Removed empty directory: ${dirPath}`);
        return true;
      } else {
        console.log(`⚠️ Directory not empty: ${dirPath}`);
        return false;
      }
    } else {
      console.log(`⚠️ Directory not found: ${dirPath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error removing directory ${dirPath}:`, error.message);
    return false;
  }
}

// Function to ensure directory exists for a file
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
  return true;
}

// Main function to remove files
async function cleanupFiles() {
  console.log('Starting cleanup process...');
  
  const projectRoot = path.resolve(__dirname, '..');
  let removedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;
  
  // Read the cleanup list
  const cleanupListPath = path.join(projectRoot, 'cleanup-list.txt');
  if (!fs.existsSync(cleanupListPath)) {
    console.error('Cleanup list not found at:', cleanupListPath);
    return;
  }
  
  const fileStream = fs.createReadStream(cleanupListPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  for await (const line of rl) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }
    
    const fullPath = path.join(projectRoot, line.trim());
    const result = safelyRemoveFile(fullPath);
    
    if (result) {
      removedCount++;
      
      // Try to remove parent directories if they're empty
      let dirPath = path.dirname(fullPath);
      while (dirPath !== projectRoot) {
        safelyRemoveDir(dirPath);
        dirPath = path.dirname(dirPath);
      }
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
