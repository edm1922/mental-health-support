# Would You Rather Game Fixes

## Changes Made

### 1. API Route (`src/app/api/would-you-rather/generate/route.js`)

- Updated to check for both `GITHUB_TOKEN` and `DEEPSEEK_API_KEY` environment variables:
  ```javascript
  // Get token from environment variables - check both GITHUB_TOKEN and DEEPSEEK_API_KEY
  const token = process.env.GITHUB_TOKEN || process.env.DEEPSEEK_API_KEY;
  ```

- Added better error logging:
  ```javascript
  // Log more detailed error information to help with debugging
  if (error.status) {
    console.error(`DeepSeek API HTTP Status: ${error.status}`);
  }
  if (error.body) {
    console.error('DeepSeek API Error Body:', error.body);
  }
  ```

### 2. Game Component (`src/components/WouldYouRatherGame.jsx`)

- Added retry functionality:
  ```javascript
  // If this is the first failure, try once more
  if (retryCount === 0) {
    console.log('Retrying question fetch...');
    setTimeout(() => fetchQuestion(retryCount + 1), 1000);
    return;
  }
  ```

- Added a retry button to the error display:
  ```jsx
  <button 
    onClick={() => fetchQuestion()}
    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors flex items-center"
  >
    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    Retry
  </button>
  ```

### 3. Inline Game Component (`src/components/WouldYouRatherGameInline.jsx`)

- Added similar retry functionality and improved error handling

## How to Test

1. Make sure the `DEEPSEEK_API_KEY` environment variable is set in your Vercel project settings
2. Deploy the changes to Vercel
3. Navigate to the home page and try to play the "Would You Rather" game
4. Check the browser console and Vercel logs for any errors

## Troubleshooting

If you still encounter issues:

1. Check that the `DEEPSEEK_API_KEY` is correctly set in Vercel
2. Look at the Vercel Function Logs for any errors
3. Try the retry button if the game fails to load
4. If all else fails, the game will use fallback questions
