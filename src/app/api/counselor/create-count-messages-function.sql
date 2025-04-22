-- Function to count unread messages for a user across multiple sessions
CREATE OR REPLACE FUNCTION public.count_unread_messages(
  user_id UUID,
  session_ids UUID[]
)
RETURNS TABLE (
  session_id UUID,
  count BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    session_id,
    COUNT(*) as count
  FROM 
    public.session_messages
  WHERE 
    recipient_id = user_id
    AND is_read = false
    AND session_id = ANY(session_ids)
  GROUP BY 
    session_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.count_unread_messages TO authenticated;
