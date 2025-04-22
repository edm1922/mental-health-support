-- Create a function to check if auth.uid() is working
CREATE OR REPLACE FUNCTION public.get_auth_uid()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_auth_uid TO authenticated;
