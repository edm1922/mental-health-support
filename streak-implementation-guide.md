# Streak Tracking Implementation Guide

This guide explains how to implement the streak tracking feature for the mental health application.

## Overview

The streak tracking feature allows users to see their current streak of consecutive daily check-ins. This helps motivate users to maintain a consistent habit of checking in with their mental health.

## Database Setup

1. Run the SQL migration script to set up the necessary database tables and functions:

   ```bash
   # For Windows
   run_streak_migration.bat
   
   # For Mac/Linux
   chmod +x run_streak_migration.sh
   ./run_streak_migration.sh
   ```

   **Note:** Before running the script, edit it to include your Supabase project ID.

2. The migration script will:
   - Create a `user_streaks` table to track streak data
   - Set up row-level security policies
   - Create triggers to automatically update streaks when users check in
   - Initialize streak records for existing users

## How It Works

### Database Logic

1. **Streak Initialization**:
   - When a user is created, a record is automatically added to the `user_streaks` table
   - Initial streak values are set to 0

2. **Streak Updates**:
   - When a user completes a check-in, a trigger function updates their streak
   - If the check-in is on the same day as their last check-in, no change occurs
   - If the check-in is exactly one day after their last check-in, the streak increments
   - If the check-in is more than one day after their last check-in, the streak resets to 1
   - The longest streak is automatically updated if the current streak exceeds it

3. **Streak Resets**:
   - A function `reset_stale_streaks()` can be called to reset streaks for users who haven't checked in for more than a day
   - This can be automated using pg_cron if available on your Supabase instance

### Frontend Implementation

The streak display is implemented in the `RoleBasedActionCards.jsx` component:

1. **Data Fetching**:
   - The component fetches the user's streak data on mount
   - It also checks if the user has already completed a check-in today

2. **Visual Display**:
   - The streak is displayed as a series of dots
   - Filled dots represent completed days in the streak
   - Empty dots represent future potential days
   - If the user has checked in today, the current day's dot pulses with a green color
   - The component also shows the user's longest streak for motivation

3. **Motivational Elements**:
   - Random motivational quotes appear when hovering over the check-in card
   - Visual feedback encourages users to maintain their streak

## Customization

You can customize the streak display by modifying:

1. **Maximum Visible Days**: Change the number of dots displayed (currently 5)
2. **Colors**: Modify the color scheme in the CSS classes
3. **Animations**: Adjust the pulse and hover animations
4. **Motivational Quotes**: Add or modify the quotes in the `quotes` array

## Troubleshooting

If streaks aren't updating correctly:

1. Check the Supabase logs for any errors in the trigger functions
2. Verify that the `mental_health_checkins` table has the correct structure
3. Ensure the user is authenticated when making check-ins
4. Check that the `created_at` timestamp is being set correctly on check-ins

## Future Enhancements

Potential improvements to consider:

1. Add streak achievements/badges for milestone streaks (7 days, 30 days, etc.)
2. Implement streak recovery (allow users to "repair" a broken streak within 48 hours)
3. Add weekly and monthly streak statistics
4. Create a streak leaderboard for community motivation
