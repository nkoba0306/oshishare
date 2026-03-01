-- 汎用カウンター更新関数
CREATE OR REPLACE FUNCTION increment_counter(
  table_name TEXT,
  row_id UUID,
  column_name TEXT,
  amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = GREATEST(%I + $1, 0) WHERE id = $2',
    table_name, column_name, column_name
  ) USING amount, row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
