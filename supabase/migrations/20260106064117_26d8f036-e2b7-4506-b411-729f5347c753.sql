-- Add publishing columns to reports table
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;