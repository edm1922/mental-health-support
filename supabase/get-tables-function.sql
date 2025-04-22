-- Function to get all tables in the database
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (
  schema_name text,
  table_name text,
  row_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name,
    (SELECT c.reltuples::bigint AS row_count)
  FROM 
    pg_class c
  JOIN 
    pg_namespace n ON n.oid = c.relnamespace
  WHERE 
    c.relkind = 'r' -- Only tables
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
  ORDER BY 
    n.nspname, 
    c.relname;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tables() TO anon;
