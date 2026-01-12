-- Add work timing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS check_in_time TIME DEFAULT '09:00:00';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS check_out_time TIME DEFAULT '17:00:00';