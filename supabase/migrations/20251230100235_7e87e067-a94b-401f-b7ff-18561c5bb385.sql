-- Add email column to event_interests table for CEO view
ALTER TABLE public.event_interests 
ADD COLUMN IF NOT EXISTS email text;

-- Update the RLS policy to allow reading email for authorized users
-- (The existing policies should already cover this since they allow SELECT for authenticated users)