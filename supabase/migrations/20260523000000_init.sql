-- Create moments table
CREATE TABLE moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  image_url TEXT NOT NULL,
  journal_entry TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  is_capsule BOOLEAN DEFAULT FALSE,
  unlock_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

-- 5-image limit trigger
CREATE OR REPLACE FUNCTION check_moment_limit() 
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM moments WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'Moment limit reached (Max 5)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER limit_moments_trigger
BEFORE INSERT ON moments
FOR EACH ROW EXECUTE FUNCTION check_moment_limit();

-- Policies
CREATE POLICY "Users can select their own moments"
ON moments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own moments"
ON moments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can select approved moments"
ON moments FOR SELECT
USING (is_approved = true);
