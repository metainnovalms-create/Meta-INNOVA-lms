-- Add join_date column to profiles table for staff pro-rated leave calculation
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS join_date DATE;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.join_date IS 'Date when the staff member joined, used for pro-rated leave calculation';