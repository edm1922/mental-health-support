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

-- Function to get database version
CREATE OR REPLACE FUNCTION version()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT version();
$$;

-- Function to get connection information
CREATE OR REPLACE FUNCTION get_connection_info()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to create tables directly
CREATE OR REPLACE FUNCTION create_table(table_name text, columns_definition text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql text;
BEGIN
  sql := format('CREATE TABLE IF NOT EXISTS public.%I (%s)', table_name, columns_definition);
  EXECUTE sql;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
