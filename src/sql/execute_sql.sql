-- Function to execute arbitrary SQL (admin only)
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS void AS $$
BEGIN
  -- Execute the SQL query
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
