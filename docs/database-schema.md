# Mental Health Support Application Database Schema

This document outlines the database schema for the Mental Health Support application. It serves as a reference for developers and can be used to quickly restore the database after resets.

## Tables Overview

| Table Name | Description |
|------------|-------------|
| user_profiles | Stores user profile information |
| discussion_posts | Stores forum posts |
| discussion_comments | Stores comments on forum posts |
| counseling_sessions | Stores counseling session information |
| mental_health_checkins | Stores user mental health check-ins |

## Detailed Schema

### user_profiles

Stores user profile information.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | User ID (matches auth.users id) |
| display_name | TEXT | | User's display name |
| bio | TEXT | | User's biography |
| image_url | TEXT | | URL to user's profile image |
| role | TEXT | DEFAULT 'user' | User role (user, counselor, admin) |
| interests | TEXT[] | | Array of user interests |
| preferences | JSONB | | User preferences stored as JSON |
| comfort_level_sharing | TEXT | | User's comfort level for sharing information |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When the profile was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When the profile was last updated |

### discussion_posts

Stores forum posts.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Post ID |
| user_id | UUID | | User who created the post |
| title | TEXT | NOT NULL | Post title |
| content | TEXT | NOT NULL | Post content |
| is_approved | BOOLEAN | DEFAULT FALSE | Whether the post is approved by a moderator |
| approved_by | UUID | | User who approved the post |
| approved_at | TIMESTAMP WITH TIME ZONE | | When the post was approved |
| is_flagged | BOOLEAN | DEFAULT FALSE | Whether the post has been flagged |
| report_count | INTEGER | DEFAULT 0 | Number of times the post has been reported |
| is_pinned | BOOLEAN | DEFAULT FALSE | Whether the post is pinned to the top |
| pinned_by | UUID | | User who pinned the post |
| pinned_at | TIMESTAMP WITH TIME ZONE | | When the post was pinned |
| is_removed | BOOLEAN | DEFAULT FALSE | Whether the post has been removed |
| removed_by | UUID | | User who removed the post |
| removed_at | TIMESTAMP WITH TIME ZONE | | When the post was removed |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When the post was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When the post was last updated |

### discussion_comments

Stores comments on forum posts.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Comment ID |
| post_id | INTEGER | REFERENCES discussion_posts(id) ON DELETE CASCADE | Post the comment belongs to |
| user_id | UUID | | User who created the comment |
| content | TEXT | NOT NULL | Comment content |
| is_flagged | BOOLEAN | DEFAULT FALSE | Whether the comment has been flagged |
| report_count | INTEGER | DEFAULT 0 | Number of times the comment has been reported |
| is_removed | BOOLEAN | DEFAULT FALSE | Whether the comment has been removed |
| removed_by | UUID | | User who removed the comment |
| removed_at | TIMESTAMP WITH TIME ZONE | | When the comment was removed |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When the comment was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When the comment was last updated |

### counseling_sessions

Stores counseling session information.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Session ID |
| counselor_id | UUID | | Counselor for the session |
| patient_id | UUID | | Patient for the session |
| scheduled_at | TIMESTAMP WITH TIME ZONE | | When the session is scheduled |
| duration_minutes | INTEGER | DEFAULT 60 | Duration of the session in minutes |
| status | TEXT | DEFAULT 'scheduled' | Session status (scheduled, completed, cancelled) |
| notes | TEXT | | Session notes |
| video_enabled | BOOLEAN | DEFAULT FALSE | Whether video is enabled for the session |
| video_room_id | TEXT | | Video room ID for the session |
| video_join_url | TEXT | | URL to join the video session |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When the session was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When the session was last updated |

### mental_health_checkins

Stores user mental health check-ins.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Check-in ID |
| user_id | UUID | | User who created the check-in |
| mood_rating | INTEGER | | User's mood rating (1-5) |
| notes | TEXT | | Additional notes about the check-in |
| sleep_hours | INTEGER | | Hours of sleep |
| stress_level | INTEGER | | Stress level (1-5) |
| anxiety_level | INTEGER | | Anxiety level (1-5) |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When the check-in was created |

## Row-Level Security (RLS) Policies

For security, the following RLS policies should be applied:

### user_profiles

```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles
CREATE POLICY user_profiles_select_policy ON user_profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY user_profiles_update_policy ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Only admins can delete profiles
CREATE POLICY user_profiles_delete_policy ON user_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### discussion_posts

```sql
-- Enable RLS
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;

-- Users can read approved posts
CREATE POLICY discussion_posts_select_policy ON discussion_posts
  FOR SELECT USING (is_approved = true OR user_id = auth.uid());

-- Users can insert their own posts
CREATE POLICY discussion_posts_insert_policy ON discussion_posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own posts
CREATE POLICY discussion_posts_update_policy ON discussion_posts
  FOR UPDATE USING (user_id = auth.uid());

-- Only admins and post owners can delete posts
CREATE POLICY discussion_posts_delete_policy ON discussion_posts
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## SQL Script to Recreate Schema

In case of a complete database reset, the following SQL script can be used to recreate the schema:

```sql
-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  image_url TEXT,
  role TEXT DEFAULT 'user',
  interests TEXT[],
  preferences JSONB,
  comfort_level_sharing TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create discussion_posts table
CREATE TABLE public.discussion_posts (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  is_flagged BOOLEAN DEFAULT FALSE,
  report_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  pinned_by UUID,
  pinned_at TIMESTAMP WITH TIME ZONE,
  is_removed BOOLEAN DEFAULT FALSE,
  removed_by UUID,
  removed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create discussion_comments table
CREATE TABLE public.discussion_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
  user_id UUID,
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE,
  report_count INTEGER DEFAULT 0,
  is_removed BOOLEAN DEFAULT FALSE,
  removed_by UUID,
  removed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create counseling_sessions table
CREATE TABLE public.counseling_sessions (
  id SERIAL PRIMARY KEY,
  counselor_id UUID,
  patient_id UUID,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  video_enabled BOOLEAN DEFAULT FALSE,
  video_room_id TEXT,
  video_join_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mental_health_checkins table
CREATE TABLE public.mental_health_checkins (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  mood_rating INTEGER,
  notes TEXT,
  sleep_hours INTEGER,
  stress_level INTEGER,
  anxiety_level INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Maintaining the Schema

When making changes to the database schema:

1. Update the migration script in `src/scripts/migrate-database.js`
2. Update this documentation
3. Run the migration script to apply changes
4. Consider creating a database backup after significant changes
