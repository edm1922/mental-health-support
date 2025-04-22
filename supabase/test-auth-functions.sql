-- Test script for authentication functions

-- Test get_current_user function
SELECT get_current_user();

-- Test get_messages_for_user function with a sample UUID
-- Replace the UUID below with an actual user ID from your auth.users table
SELECT * FROM get_messages_for_user('00000000-0000-0000-0000-000000000000');

-- Test uuid_to_bigint function
SELECT uuid_to_bigint('00000000-0000-0000-0000-000000000000');

-- Check if the auth.users table has users
SELECT id, email, role FROM auth.users LIMIT 10;

-- Check if the public.user_profiles table has profiles
SELECT id, display_name, role FROM public.user_profiles LIMIT 10;

-- Check if the public.session_messages table has messages
SELECT id, session_id, sender_id, recipient_id, message FROM public.session_messages LIMIT 10;

-- Check if the public.counseling_sessions table has sessions
SELECT id, counselor_id, patient_id, session_date, status FROM public.counseling_sessions LIMIT 10;
