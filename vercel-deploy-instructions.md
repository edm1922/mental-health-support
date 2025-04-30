# Deploying to Vercel Without GitHub

Since we're having issues pushing to GitHub due to the detected secret in the commit history, here's how to deploy directly to Vercel:

## Option 1: Deploy from the Vercel Dashboard

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to the "Deployments" tab
4. Click "Deploy" button
5. Choose "Deploy from Local" option
6. Follow the instructions to deploy your local project

## Option 2: Use the Vercel CLI

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy your project:
   ```
   vercel --prod
   ```

## Important Environment Variables

Make sure your Vercel project has the following environment variables set:

- `DEEPSEEK_API_KEY`: Your DeepSeek API key for the "Would You Rather" game
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Changes Made to Fix the "Would You Rather" Game

1. Updated the API route to check for both `GITHUB_TOKEN` and `DEEPSEEK_API_KEY` environment variables
2. Added better error handling and logging
3. Improved the retry mechanism in the game components
4. Added a retry button to the error display

These changes should make the game more reliable and provide better feedback when errors occur.
