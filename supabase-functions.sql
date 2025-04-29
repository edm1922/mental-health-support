-- Function to execute SQL queries
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO anon;

-- Function to get database version
CREATE OR REPLACE FUNCTION version()
RETURNS text
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT version();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION version() TO authenticated;
GRANT EXECUTE ON FUNCTION version() TO anon;

-- Function to get connection information
CREATE OR REPLACE FUNCTION get_connection_info()
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'current_database', current_database(),
    'current_schema', current_schema,
    'current_user', current_user
  ) INTO result
  FROM current_schema();
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_connection_info() TO authenticated;
GRANT EXECUTE ON FUNCTION get_connection_info() TO anon;
