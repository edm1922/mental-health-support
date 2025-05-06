-- Script to fix triggers that reset user roles

-- First, check for triggers on the auth.users table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';

-- Check for any triggers on the user_profiles table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles'
AND event_object_schema = 'public';

-- Check for the create_profile_on_signup trigger specifically
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'create_profile_on_signup';

-- Drop the create_profile_on_signup trigger if it exists
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- Drop the create_profile_after_signup trigger if it exists
DROP TRIGGER IF EXISTS create_profile_after_signup ON auth.users;

-- Disable the initialize_streak_on_user_creation trigger if it exists
DROP TRIGGER IF EXISTS initialize_streak_on_user_creation ON auth.users;

-- Modify the create_profile_on_signup function to preserve existing roles
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    -- Update profile but preserve role
    UPDATE public.user_profiles
    SET
      display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      updated_at = NOW()
    WHERE id = NEW.id;
  ELSE
    -- Insert new profile with role 'user'
    INSERT INTO public.user_profiles (id, display_name, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      'user'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check for the handle_new_user trigger
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%handle_new_user%';

-- Drop any handle_new_user triggers
DO $$
DECLARE
    trigger_name text;
BEGIN
    FOR trigger_name IN (
        SELECT t.tgname
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE p.proname = 'handle_new_user'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_name || ' ON auth.users';
    END LOOP;
END $$;

-- Modify the handle_new_user function to preserve existing roles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    -- Update profile but preserve role
    UPDATE public.user_profiles
    SET
      display_name = COALESCE(
        (NEW.raw_user_meta_data->>'display_name'),
        (NEW.raw_user_meta_data->>'full_name'),
        split_part(NEW.email, '@', 1),
        'New User'
      ),
      updated_at = NOW()
    WHERE id = NEW.id;
  ELSE
    -- Insert new profile with role from metadata or default to 'user'
    INSERT INTO public.user_profiles (
      id,
      display_name,
      role,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(
        (NEW.raw_user_meta_data->>'display_name'),
        (NEW.raw_user_meta_data->>'full_name'),
        split_part(NEW.email, '@', 1),
        'New User'
      ),
      COALESCE((NEW.raw_user_meta_data->>'role'), 'user'),
      COALESCE(NEW.created_at, NOW()),
      COALESCE(NEW.updated_at, NOW())
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to permanently set a user as a counselor
CREATE OR REPLACE FUNCTION public.set_user_as_counselor_permanent(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the user's role to counselor
  UPDATE public.user_profiles
  SET role = 'counselor',
      updated_at = NOW()
  WHERE id = user_id;

  -- Update the user's metadata to include the role
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"counselor"'
  )
  WHERE id = user_id;

  -- Create a trigger to prevent the role from being changed back to 'user'
  EXECUTE format('
    CREATE OR REPLACE FUNCTION maintain_counselor_role_%s()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF NEW.role != ''counselor'' AND OLD.role = ''counselor'' THEN
        RAISE NOTICE ''Preventing role change from counselor to %'', NEW.role;
        NEW.role := ''counselor'';
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS maintain_counselor_role_%s ON public.user_profiles;
    CREATE TRIGGER maintain_counselor_role_%s
    BEFORE UPDATE OF role ON public.user_profiles
    FOR EACH ROW
    WHEN (OLD.id = %L)
    EXECUTE FUNCTION maintain_counselor_role_%s();
  ', user_id, user_id, user_id, user_id, user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set the specific user as a counselor (replace with the actual user ID)
-- SELECT set_user_as_counselor_permanent('YOUR_USER_ID_HERE');

-- Check if there are any triggers that might be resetting the role
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles'
AND event_object_schema = 'public'
AND action_statement ILIKE '%role%';
