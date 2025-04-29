#!/bin/bash

# Create a production build
echo "Creating production build..."
npm run build

# Create a deployment directory if it doesn't exist
mkdir -p deployment

# Copy necessary files for deployment
echo "Preparing deployment files..."
cp -r .next deployment/
cp -r public deployment/
cp package.json deployment/
cp package-lock.json deployment/
cp next.config.js deployment/
cp .env.production deployment/.env

# Create a README for deployment
cat > deployment/README.md << EOL
# Deployment Instructions

This directory contains all the files needed to deploy your Next.js application.

## To deploy on a server:

1. Upload all these files to your server
2. Run \`npm install --production\` to install dependencies
3. Run \`npm start\` to start the production server

## Environment Variables

Make sure your environment variables are properly set in the .env file.
EOL

echo "Deployment files prepared in the 'deployment' directory"
echo "You can now upload the contents of the 'deployment' directory to your hosting provider"
