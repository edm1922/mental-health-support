/**
 * Health Check Script
 * 
 * This script checks if the application is running correctly by making a request to the health endpoint.
 * It can be used in CI/CD pipelines or as a post-deployment check.
 * 
 * Usage:
 * node scripts/health-check.js [url]
 * 
 * If no URL is provided, it defaults to http://localhost:3000
 */

const http = require('http');
const https = require('https');

// Get the URL from command line arguments or use default
const url = process.argv[2] || 'http://localhost:3000';
const healthEndpoint = `${url}/api/health`;

console.log(`Checking health at: ${healthEndpoint}`);

// Determine which protocol to use
const client = healthEndpoint.startsWith('https') ? https : http;

// Make the request
const req = client.get(healthEndpoint, (res) => {
  let data = '';

  // A chunk of data has been received
  res.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received
  res.on('end', () => {
    try {
      const healthData = JSON.parse(data);
      
      console.log('Health check response:');
      console.log(JSON.stringify(healthData, null, 2));
      
      if (res.statusCode === 200 && healthData.status === 'ok') {
        console.log('\n✅ Application is healthy!');
        process.exit(0);
      } else {
        console.error('\n❌ Application health check failed!');
        console.error(`Status code: ${res.statusCode}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ Failed to parse health check response:');
      console.error(error.message);
      process.exit(1);
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('\n❌ Health check request failed:');
  console.error(error.message);
  process.exit(1);
});

// Set a timeout
req.setTimeout(10000, () => {
  console.error('\n❌ Health check timed out after 10 seconds');
  req.destroy();
  process.exit(1);
});
