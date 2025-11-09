-- Create purchase_history table
CREATE TABLE purchase_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('premium_basic', 'premium_pro', 'premium_elite', 'verification_badge')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchase history
CREATE POLICY "Users can view their own purchases"
  ON purchase_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own purchase records
CREATE POLICY "Users can create their own purchases"
  ON purchase_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_purchase_history_user_id ON purchase_history(user_id);
CREATE INDEX idx_purchase_history_created_at ON purchase_history(created_at DESC);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_purchase_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchase_history_updated_at_trigger
  BEFORE UPDATE ON purchase_history
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_history_updated_at();