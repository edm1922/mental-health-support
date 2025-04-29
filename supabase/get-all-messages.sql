-- Create a function to get all messages (bypassing RLS)
CREATE OR REPLACE FUNCTION get_all_messages()
RETURNS TABLE (
  id uuid,
  session_id uuid,
  sender_id uuid,
  recipient_id uuid,
  message text,
  is_read boolean,
  created_at timestamptz,
  sender_name text,
  recipient_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id,
    sm.session_id,
    sm.sender_id,
    sm.recipient_id,
    sm.message,
    sm.is_read,
    sm.created_at,
    sender.display_name as sender_name,
    recipient.display_name as recipient_name
  FROM 
    public.session_messages sm
  JOIN 
    public.user_profiles sender ON sm.sender_id = sender.id
  JOIN 
    public.user_profiles recipient ON sm.recipient_id = recipient.id
  ORDER BY 
    sm.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_all_messages() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_messages() TO anon;
