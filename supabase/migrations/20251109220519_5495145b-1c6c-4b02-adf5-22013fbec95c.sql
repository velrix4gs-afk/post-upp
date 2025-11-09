-- Fix function search path with CASCADE
DROP FUNCTION IF EXISTS update_purchase_history_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_purchase_history_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_purchase_history_updated_at_trigger
  BEFORE UPDATE ON purchase_history
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_history_updated_at();