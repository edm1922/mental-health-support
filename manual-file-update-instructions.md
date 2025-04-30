# Manual File Update Instructions

If you're unable to push to GitHub or deploy directly to Vercel, you can manually update the files in the Vercel dashboard:

## Files to Update

### 1. `src/app/api/would-you-rather/generate/route.js`

Replace the beginning of the file with:

```javascript
import { NextResponse } from 'next/server';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

export const dynamic = 'force-dynamic';

// GitHub API configuration
const endpoint = "https://models.github.ai/inference";
const model = "deepseek/DeepSeek-V3-0324";

export async function GET() {
  try {
    // Get token from environment variables - check both GITHUB_TOKEN and DEEPSEEK_API_KEY
    const token = process.env.GITHUB_TOKEN || process.env.DEEPSEEK_API_KEY;
    
    // Check if token is available
    if (!token) {
      console.log('No API token found in environment variables (checked GITHUB_TOKEN and DEEPSEEK_API_KEY), using fallback questions');
      throw new Error('API token not configured');
    }
    
    console.log('API token found, attempting to use DeepSeek API');
```

And update the error handling section with:

```javascript
  } catch (error) {
    console.error('Error generating Would You Rather with DeepSeek:', error);
    
    // Log more detailed error information to help with debugging
    if (error.status) {
      console.error(`DeepSeek API HTTP Status: ${error.status}`);
    }
    if (error.body) {
      console.error('DeepSeek API Error Body:', error.body);
    }
    
    console.log('Falling back to predefined questions');
```

### 2. `src/components/WouldYouRatherGame.jsx`

Update the `fetchQuestion` function with:

```javascript
  // Function to fetch a new "Would You Rather" question
  const fetchQuestion = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      console.log('Fetching Would You Rather question, attempt:', retryCount + 1);
      
      const response = await fetch('/api/would-you-rather/generate');
      
      if (!response.ok) {
        console.error(`API responded with status: ${response.status}`);
        throw new Error(`Failed to fetch question (Status: ${response.status})`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Successfully fetched question:', data.source);
        setQuestion(data);
        // Reset state for new question
        setSelectedOption(null);
        setShowResults(false);
        
        // Simulate some initial votes for a better UX
        setResults({
          optionA: Math.floor(Math.random() * 30) + 10,
          optionB: Math.floor(Math.random() * 30) + 10
        });
      } else {
        console.error('API returned success: false', data.error);
        throw new Error(data.error || 'Failed to generate question');
      }
    } catch (error) {
      console.error('Error fetching Would You Rather question:', error);
      
      // If this is the first failure, try once more
      if (retryCount === 0) {
        console.log('Retrying question fetch...');
        setTimeout(() => fetchQuestion(retryCount + 1), 1000);
        return;
      }
      
      setError('Could not load the game. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
```

And update the error display with:

```jsx
  // If there's an error, show error message with retry option
  if (error) {
    return (
      <motion.div
        className="w-64 bg-white text-gray-800 text-sm rounded-2xl shadow-2xl p-5 z-40 border border-indigo-100"
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 5, scale: 0.98 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <p className="text-red-500 mb-3">{error}</p>
          <div className="flex justify-center space-x-2">
            <button 
              onClick={() => fetchQuestion()}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors flex items-center"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Retry
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    );
  }
```

### 3. `src/components/WouldYouRatherGameInline.jsx`

Make similar updates to the `fetchQuestion` function as in the `WouldYouRatherGame.jsx` file.

## Vercel Environment Variables

Make sure to add the `DEEPSEEK_API_KEY` environment variable in your Vercel project settings.
