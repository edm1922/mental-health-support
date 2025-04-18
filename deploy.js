const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the .env.production file exists
if (!fs.existsSync(path.join(process.cwd(), '.env.production'))) {
  console.log('Creating .env.production file...');
  fs.copyFileSync(
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env.production')
  );
}

// Build the application
console.log('Building the application...');
execSync('npm run build:deploy', { stdio: 'inherit' });

console.log('Build completed successfully!');
console.log('Your app is ready to be deployed from the "out" directory.');
console.log('You can deploy this directory to any static hosting service like Vercel, Netlify, or GitHub Pages.');
