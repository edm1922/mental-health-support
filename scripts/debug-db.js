// This script can be run directly with Node.js to debug the database
// Run it with: node scripts/debug-db.js

// Set up environment variables from .env file
require('dotenv').config();

// Import the debug function
const { debugDatabase } = require('../src/lib/debug-database');

// Run the debug function
console.log('Starting database debugging...');
debugDatabase()
  .then(() => {
    console.log('Database debugging completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during database debugging:', error);
    process.exit(1);
  });
